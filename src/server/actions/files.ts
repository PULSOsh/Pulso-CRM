"use server";

import crypto from "node:crypto";
import { and, desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { ATTACHABLE_ENTITY_TYPES, type AttachableEntityType } from "../attachable-entity-types";
import { requirePermission } from "../auth/require-permission";
import { db } from "../db/connection";
import {
  approvals,
  attachments,
  briefingSubmissions,
  companies,
  contacts,
  contracts,
  expenses,
  installments,
  opportunities,
  projects,
  proposals,
  receivables,
  storedFiles,
} from "../db/schema";
import { deleteObject, getSignedDownloadUrl, uploadObject } from "../storage/s3";
import { exceedsMaxUploadSize, isAllowedMimeType, sanitizeFileName } from "./files.validation";

// entityId vem do cliente - antes de gravar um attachment, confirma que a
// entidade referenciada realmente pertence à organização da sessão. Sem essa
// checagem, um usuário poderia vincular um anexo a um registro de outra
// organização (mesma classe de bug já corrigida em pipeline.ts/quotes.ts/
// contacts.ts/projects.ts).
async function entityBelongsToOrganization(
  entityType: AttachableEntityType,
  entityId: string,
  organizationId: string,
): Promise<boolean> {
  switch (entityType) {
    case "contact":
      return !!(await db.query.contacts.findFirst({
        where: and(eq(contacts.id, entityId), eq(contacts.organizationId, organizationId)),
        columns: { id: true },
      }));
    case "company":
      return !!(await db.query.companies.findFirst({
        where: and(eq(companies.id, entityId), eq(companies.organizationId, organizationId)),
        columns: { id: true },
      }));
    case "opportunity":
      return !!(await db.query.opportunities.findFirst({
        where: and(eq(opportunities.id, entityId), eq(opportunities.organizationId, organizationId)),
        columns: { id: true },
      }));
    case "briefing":
      return !!(await db.query.briefingSubmissions.findFirst({
        where: and(
          eq(briefingSubmissions.id, entityId),
          eq(briefingSubmissions.organizationId, organizationId),
        ),
        columns: { id: true },
      }));
    case "proposal":
      return !!(await db.query.proposals.findFirst({
        where: and(eq(proposals.id, entityId), eq(proposals.organizationId, organizationId)),
        columns: { id: true },
      }));
    case "contract":
      return !!(await db.query.contracts.findFirst({
        where: and(eq(contracts.id, entityId), eq(contracts.organizationId, organizationId)),
        columns: { id: true },
      }));
    case "project":
      return !!(await db.query.projects.findFirst({
        where: and(eq(projects.id, entityId), eq(projects.organizationId, organizationId)),
        columns: { id: true },
      }));
    case "approval":
      return !!(await db.query.approvals.findFirst({
        where: and(eq(approvals.id, entityId), eq(approvals.organizationId, organizationId)),
        columns: { id: true },
      }));
    case "receivable":
      return !!(await db.query.receivables.findFirst({
        where: and(eq(receivables.id, entityId), eq(receivables.organizationId, organizationId)),
        columns: { id: true },
      }));
    case "expense":
      return !!(await db.query.expenses.findFirst({
        where: and(eq(expenses.id, entityId), eq(expenses.organizationId, organizationId)),
        columns: { id: true },
      }));
    case "installment": {
      // installments não tem organizationId próprio - a organização é
      // resolvida via receivables.organizationId.
      const installment = await db.query.installments.findFirst({
        where: eq(installments.id, entityId),
        columns: { receivableId: true },
      });
      if (!installment) return false;
      return !!(await db.query.receivables.findFirst({
        where: and(
          eq(receivables.id, installment.receivableId),
          eq(receivables.organizationId, organizationId),
        ),
        columns: { id: true },
      }));
    }
  }
}

export async function uploadFile(
  entityType: AttachableEntityType,
  entityId: string,
  formData: FormData,
  supersedesAttachmentId?: string,
) {
  const { organizationId, userId } = await requirePermission("files.upload");

  if (!ATTACHABLE_ENTITY_TYPES.includes(entityType)) {
    throw new Error("Tipo de entidade inválido.");
  }
  if (!(await entityBelongsToOrganization(entityType, entityId, organizationId))) {
    throw new Error("Registro não encontrado.");
  }

  // CRM-F2-05: nova versão de um anexo existente - confirma que o anexo
  // anterior pertence à mesma organização/entidade antes de encadear (mesma
  // classe de checagem de posse já aplicada a client-supplied ids em outras
  // actions desta sessão).
  let versionNumber = 1;
  let rootAttachmentId: string | null = null;
  let previousAttachment: typeof attachments.$inferSelect | undefined;
  if (supersedesAttachmentId) {
    previousAttachment = await db.query.attachments.findFirst({
      where: and(
        eq(attachments.id, supersedesAttachmentId),
        eq(attachments.organizationId, organizationId),
        eq(attachments.entityType, entityType),
        eq(attachments.entityId, entityId),
      ),
    });
    if (!previousAttachment) throw new Error("Anexo anterior não encontrado.");
    rootAttachmentId = previousAttachment.rootAttachmentId ?? previousAttachment.id;
    versionNumber = previousAttachment.versionNumber + 1;
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    throw new Error("Nenhum arquivo enviado.");
  }
  if (!isAllowedMimeType(file.type)) {
    throw new Error(`Tipo de arquivo não permitido: ${file.type || "desconhecido"}.`);
  }
  if (exceedsMaxUploadSize(file.size, process.env.MAX_UPLOAD_SIZE_MB)) {
    throw new Error(`Arquivo excede o limite de ${process.env.MAX_UPLOAD_SIZE_MB || "20"}MB.`);
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const checksum = crypto.createHash("sha256").update(buffer).digest("hex");
  const objectKey = `${organizationId}/${entityType}/${entityId}/${crypto.randomUUID()}-${sanitizeFileName(file.name)}`;

  await uploadObject(objectKey, buffer, file.type);

  // Only proposal/contract/approval/project attachments can be marked public
  // (shown on the matching public page); everything else stays private
  // regardless of the form field, since there is no public page that would
  // ever read it.
  const canBePublic =
    entityType === "proposal" ||
    entityType === "contract" ||
    entityType === "approval" ||
    entityType === "project";
  const isPrivate = !(canBePublic && formData.get("isPublic") === "true");

  const fileId = crypto.randomUUID();
  await db.transaction(async (tx) => {
    await tx.insert(storedFiles).values({
      id: fileId,
      organizationId,
      uploadedBy: userId,
      storageProvider: "s3",
      bucket: process.env.S3_BUCKET,
      objectKey,
      originalName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      checksumSha256: checksum,
      isPrivate,
    });

    if (previousAttachment) {
      await tx
        .update(attachments)
        .set({ isCurrent: false })
        .where(eq(attachments.id, previousAttachment.id));
    }

    await tx.insert(attachments).values({
      organizationId,
      fileId,
      entityType,
      entityId,
      versionNumber,
      rootAttachmentId,
      isCurrent: true,
    });
  });

  revalidatePath("/crm", "layout");
  return { success: true, fileId };
}

export async function getFilesForEntity(entityType: AttachableEntityType, entityId: string) {
  const { organizationId } = await requirePermission("files.read");

  const rows = await db.query.attachments.findMany({
    where: and(
      eq(attachments.organizationId, organizationId),
      eq(attachments.entityType, entityType),
      eq(attachments.entityId, entityId),
      eq(attachments.isCurrent, true),
    ),
    orderBy: [desc(attachments.createdAt)],
    with: { file: true },
  });

  return rows
    .filter((row) => row.file)
    .map((row) => ({
      attachmentId: row.id,
      fileId: row.file.id,
      originalName: row.file.originalName,
      mimeType: row.file.mimeType,
      sizeBytes: row.file.sizeBytes,
      createdAt: row.file.createdAt,
      label: row.label,
      versionNumber: row.versionNumber,
    }));
}

/** Histórico completo de versões de um anexo (CRM-F2-05), mais antiga
 * primeiro. Resolve a raiz da cadeia (o próprio anexo, se ele nunca foi
 * superado, ou o valor já gravado em rootAttachmentId) e lista todas as
 * linhas que compartilham essa raiz. */
export async function getFileVersionHistory(attachmentId: string) {
  const { organizationId } = await requirePermission("files.read");

  const attachment = await db.query.attachments.findFirst({
    where: and(eq(attachments.id, attachmentId), eq(attachments.organizationId, organizationId)),
  });
  if (!attachment) throw new Error("Anexo não encontrado.");

  const rootId = attachment.rootAttachmentId ?? attachment.id;

  const rows = await db.query.attachments.findMany({
    where: and(eq(attachments.organizationId, organizationId), eq(attachments.rootAttachmentId, rootId)),
    orderBy: [desc(attachments.versionNumber)],
    with: { file: true },
  });

  const rootRow = await db.query.attachments.findFirst({
    where: eq(attachments.id, rootId),
    with: { file: true },
  });

  const all = rootRow ? [rootRow, ...rows] : rows;

  return all
    .filter((row) => row.file)
    .sort((a, b) => b.versionNumber - a.versionNumber)
    .map((row) => ({
      attachmentId: row.id,
      fileId: row.file.id,
      originalName: row.file.originalName,
      versionNumber: row.versionNumber,
      isCurrent: row.isCurrent,
      createdAt: row.file.createdAt,
    }));
}

export async function getFileDownloadUrl(fileId: string) {
  const { organizationId } = await requirePermission("files.read");

  const file = await db.query.storedFiles.findFirst({
    where: and(eq(storedFiles.id, fileId), eq(storedFiles.organizationId, organizationId)),
  });
  if (!file) throw new Error("Arquivo não encontrado.");

  return getSignedDownloadUrl(file.objectKey);
}

export async function deleteFile(attachmentId: string) {
  const { organizationId } = await requirePermission("files.delete");

  const attachment = await db.query.attachments.findFirst({
    where: and(eq(attachments.id, attachmentId), eq(attachments.organizationId, organizationId)),
  });
  if (!attachment) throw new Error("Anexo não encontrado.");

  // Exclusão lógica: remove só o vínculo (attachment). O objeto no storage e
  // o registro em storedFiles permanecem intactos - não apagamos o arquivo
  // físico sem uma confirmação/rotina de limpeza de órfãos separada
  // (docs/MODULE_SPECIFICATIONS.md §10: "exclusão lógica" + "limpeza de órfãos").
  await db.delete(attachments).where(eq(attachments.id, attachmentId));

  revalidatePath("/crm", "layout");
  return { success: true };
}

/**
 * No requirePermission() here on purpose - this is meant to be called from
 * inside an already-gated public action (getPublicProposal/getPublicContract/
 * getClientPortalProject), which resolves organizationId/entityId itself only
 * after validating the public token + enabled flag. Only ever returns
 * attachments whose underlying file is explicitly isPrivate = false.
 */
export async function getPublicFilesForEntity(
  organizationId: string,
  entityType: "proposal" | "contract" | "approval" | "project",
  entityId: string,
) {
  const rows = await db.query.attachments.findMany({
    where: and(
      eq(attachments.organizationId, organizationId),
      eq(attachments.entityType, entityType),
      eq(attachments.entityId, entityId),
      eq(attachments.isCurrent, true),
    ),
    with: { file: true },
  });

  const publicFiles = rows.filter((row) => row.file && row.file.isPrivate === false);

  return Promise.all(
    publicFiles.map(async (row) => ({
      originalName: row.file.originalName,
      label: row.label,
      url: await getSignedDownloadUrl(row.file.objectKey, 3600),
    })),
  );
}

export async function purgeOrphanedFile(fileId: string) {
  const { organizationId } = await requirePermission("files.delete");

  const file = await db.query.storedFiles.findFirst({
    where: and(eq(storedFiles.id, fileId), eq(storedFiles.organizationId, organizationId)),
  });
  if (!file) throw new Error("Arquivo não encontrado.");

  const stillAttached = await db.query.attachments.findFirst({
    where: eq(attachments.fileId, fileId),
  });
  if (stillAttached) {
    throw new Error("Arquivo ainda está vinculado a um registro; remova o vínculo primeiro.");
  }

  await deleteObject(file.objectKey);
  await db.delete(storedFiles).where(eq(storedFiles.id, fileId));

  return { success: true };
}
