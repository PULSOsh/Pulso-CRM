import {
  type AnyPgColumn,
  bigint,
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { organizations } from "./organizations";
import { users } from "./users";

export const storedFiles = pgTable("stored_files", {
  id: uuid("id").defaultRandom().primaryKey(),
  organizationId: uuid("organization_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  uploadedBy: uuid("uploaded_by").references(() => users.id, { onDelete: "set null" }),
  storageProvider: varchar("storage_provider", { length: 40 }).notNull().default("s3"),
  bucket: varchar("bucket", { length: 120 }),
  objectKey: text("object_key").notNull(),
  originalName: varchar("original_name", { length: 255 }).notNull(),
  mimeType: varchar("mime_type", { length: 160 }),
  sizeBytes: bigint("size_bytes", { mode: "number" }),
  checksumSha256: varchar("checksum_sha256", { length: 64 }),
  isPrivate: boolean("is_private").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
});

export const attachments = pgTable(
  "attachments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    organizationId: uuid("organization_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    fileId: uuid("file_id")
      .notNull()
      .references(() => storedFiles.id, { onDelete: "cascade" }),
    entityType: varchar("entity_type", { length: 40 }).notNull(),
    entityId: uuid("entity_id").notNull(),
    label: varchar("label", { length: 120 }),
    // CRM-F2-05: versionamento - uma nova versão de um anexo existente cria
    // uma linha nova (nunca edita a anterior, "histórico confiável")
    // apontando pra raiz da cadeia via rootAttachmentId, com isCurrent
    // marcando qual é a versão vigente pra listagens padrão.
    versionNumber: integer("version_number").notNull().default(1),
    rootAttachmentId: uuid("root_attachment_id").references((): AnyPgColumn => attachments.id, {
      onDelete: "set null",
    }),
    isCurrent: boolean("is_current").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true, mode: "date" }).notNull().defaultNow(),
  },
  (t) => [index("attachments_entity_idx").on(t.organizationId, t.entityType, t.entityId)],
);
