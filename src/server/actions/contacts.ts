"use server";

import { and, desc, eq, isNotNull, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requirePermission } from "../auth/require-permission";
import { db } from "../db/connection";
import { companies, companyContacts, contacts } from "../db/schema";
import { csvToObjects } from "../services/csv";
import { normalizeDigits, normalizeEmail } from "../services/dedup";
import { importContactRowSchema, updateContactSchema } from "./contacts.schemas";

export type ImportResult = {
  created: number;
  duplicates: { row: number; reason: string }[];
  invalid: { row: number; error: string }[];
};

export async function getContacts() {
  const { organizationId } = await requirePermission("contacts.read");

  return await db
    .select({
      id: contacts.id,
      firstName: contacts.firstName,
      lastName: contacts.lastName,
      email: contacts.email,
      phone: contacts.phone,
      whatsapp: contacts.whatsapp,
      jobTitle: contacts.jobTitle,
      createdAt: contacts.createdAt,
      companyId: companyContacts.companyId,
      companyName: companies.tradeName,
    })
    .from(contacts)
    .leftJoin(
      companyContacts,
      and(eq(companyContacts.contactId, contacts.id), eq(companyContacts.isPrimary, true)),
    )
    .leftJoin(
      companies,
      and(eq(companies.id, companyContacts.companyId), eq(companies.organizationId, organizationId)),
    )
    .where(and(eq(contacts.organizationId, organizationId), isNull(contacts.deletedAt)))
    .orderBy(desc(contacts.createdAt));
}

// companyId vem do cliente em createContact/updateContact - resolve o nome só
// depois de confirmar que a empresa pertence à organização da sessão, senão
// um usuário poderia vincular (e a UI mostraria o nome de) uma empresa de
// outra organização.
async function findOwnedCompanyName(companyId: string, organizationId: string) {
  const company = await db.query.companies.findFirst({
    where: and(eq(companies.id, companyId), eq(companies.organizationId, organizationId)),
    columns: { tradeName: true },
  });
  if (!company) throw new Error("Empresa não encontrada.");
  return company.tradeName;
}

export async function createContact(input: unknown) {
  const { organizationId } = await requirePermission("contacts.create");
  const parsed = updateContactSchema.parse(input);

  const [contact] = await db
    .insert(contacts)
    .values({
      organizationId,
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      email: parsed.email,
      phone: parsed.phone,
      whatsapp: parsed.whatsapp,
      jobTitle: parsed.jobTitle,
    })
    .returning();

  let companyName: string | null = null;
  if (parsed.companyId) {
    companyName = await findOwnedCompanyName(parsed.companyId, organizationId);
    await db
      .insert(companyContacts)
      .values({ companyId: parsed.companyId, contactId: contact.id, isPrimary: true });
  }

  revalidatePath("/crm/contatos");
  return { ...contact, companyId: parsed.companyId || null, companyName };
}

export async function importContacts(csvText: string): Promise<ImportResult> {
  const { organizationId } = await requirePermission("contacts.create");

  const rows = csvToObjects(csvText);
  if (rows.length === 0) throw new Error("CSV vazio ou sem linhas de dados.");
  if (rows.length > 1000) throw new Error("Máximo de 1000 linhas por importação.");

  const [existingContacts, existingCompanies] = await Promise.all([
    db.query.contacts.findMany({
      where: and(eq(contacts.organizationId, organizationId), isNull(contacts.deletedAt)),
      columns: { email: true, phone: true, whatsapp: true },
    }),
    db.query.companies.findMany({
      where: and(eq(companies.organizationId, organizationId), isNull(companies.deletedAt)),
      columns: { id: true, tradeName: true },
    }),
  ]);

  const existingEmails = new Set(
    existingContacts.map((c) => normalizeEmail(c.email)).filter((v): v is string => !!v),
  );
  const existingPhones = new Set(
    existingContacts
      .flatMap((c) => [normalizeDigits(c.phone), normalizeDigits(c.whatsapp)])
      .filter((v): v is string => !!v),
  );
  const companyIdByName = new Map(
    existingCompanies.map((c) => [c.tradeName.trim().toLowerCase(), c.id]),
  );

  const seenEmails = new Set<string>();
  const seenPhones = new Set<string>();
  const duplicates: ImportResult["duplicates"] = [];
  const invalid: ImportResult["invalid"] = [];
  const toInsert: { values: typeof contacts.$inferInsert; companyId?: string }[] = [];

  rows.forEach((rawRow, index) => {
    const rowNumber = index + 2; // linha 1 é o cabeçalho; humanos contam a partir de 1
    const parsed = importContactRowSchema.safeParse(rawRow);
    if (!parsed.success) {
      invalid.push({ row: rowNumber, error: parsed.error.issues[0]?.message ?? "Linha inválida." });
      return;
    }
    const data = parsed.data;
    const email = normalizeEmail(data.email);
    const phone = normalizeDigits(data.telefone) ?? normalizeDigits(data.whatsapp);

    if (email && (existingEmails.has(email) || seenEmails.has(email))) {
      duplicates.push({ row: rowNumber, reason: `E-mail já cadastrado: ${data.email}` });
      return;
    }
    if (phone && (existingPhones.has(phone) || seenPhones.has(phone))) {
      duplicates.push({
        row: rowNumber,
        reason: `Telefone já cadastrado: ${data.telefone || data.whatsapp}`,
      });
      return;
    }
    if (email) seenEmails.add(email);
    if (phone) seenPhones.add(phone);

    const companyId = data.empresa
      ? companyIdByName.get(data.empresa.trim().toLowerCase())
      : undefined;

    toInsert.push({
      values: {
        organizationId,
        firstName: data.nome,
        lastName: data.sobrenome || null,
        email: data.email || null,
        phone: data.telefone || null,
        whatsapp: data.whatsapp || null,
        jobTitle: data.cargo || null,
      },
      companyId,
    });
  });

  if (toInsert.length > 0) {
    await db.transaction(async (tx) => {
      const inserted = await tx
        .insert(contacts)
        .values(toInsert.map((item) => item.values))
        .returning({ id: contacts.id });

      const links = inserted
        .map((row, index) => ({ contactId: row.id, companyId: toInsert[index].companyId }))
        .filter((link): link is { contactId: string; companyId: string } => !!link.companyId);

      if (links.length > 0) {
        await tx.insert(companyContacts).values(
          links.map((link) => ({
            companyId: link.companyId,
            contactId: link.contactId,
            isPrimary: true,
          })),
        );
      }
    });
  }

  revalidatePath("/crm/contatos");
  return { created: toInsert.length, duplicates, invalid };
}

export async function updateContact(contactId: string, input: unknown) {
  const { organizationId } = await requirePermission("contacts.update");
  const parsed = updateContactSchema.parse(input);

  const [updated] = await db
    .update(contacts)
    .set({
      firstName: parsed.firstName,
      lastName: parsed.lastName,
      email: parsed.email,
      phone: parsed.phone,
      whatsapp: parsed.whatsapp,
      jobTitle: parsed.jobTitle,
      updatedAt: new Date(),
    })
    .where(and(eq(contacts.id, contactId), eq(contacts.organizationId, organizationId)))
    .returning({ id: contacts.id });

  if (!updated) throw new Error("Contato não encontrado.");

  // Simple 1:1 model for this slice: replace whatever primary company link
  // existed with the one chosen in the form (or none).
  await db.delete(companyContacts).where(eq(companyContacts.contactId, contactId));
  let companyName: string | null = null;
  if (parsed.companyId) {
    companyName = await findOwnedCompanyName(parsed.companyId, organizationId);
    await db
      .insert(companyContacts)
      .values({ companyId: parsed.companyId, contactId, isPrimary: true });
  }

  revalidatePath("/crm/contatos");
  return { success: true, companyId: parsed.companyId || null, companyName };
}

export async function deleteContact(contactId: string) {
  const { organizationId } = await requirePermission("contacts.delete");

  const [updated] = await db
    .update(contacts)
    .set({ deletedAt: new Date() })
    .where(and(eq(contacts.id, contactId), eq(contacts.organizationId, organizationId)))
    .returning({ id: contacts.id });

  if (!updated) throw new Error("Contato não encontrado.");

  revalidatePath("/crm/contatos");
  return { success: true };
}

export async function getDeletedContacts() {
  const { organizationId } = await requirePermission("contacts.restore");

  return await db.query.contacts.findMany({
    where: and(eq(contacts.organizationId, organizationId), isNotNull(contacts.deletedAt)),
    orderBy: (contacts, { desc }) => [desc(contacts.deletedAt)],
  });
}

export async function restoreContact(contactId: string) {
  const { organizationId } = await requirePermission("contacts.restore");

  const [updated] = await db
    .update(contacts)
    .set({ deletedAt: null })
    .where(and(eq(contacts.id, contactId), eq(contacts.organizationId, organizationId)))
    .returning({ id: contacts.id });

  if (!updated) throw new Error("Contato não encontrado.");

  revalidatePath("/crm/contatos");
  return { success: true };
}
