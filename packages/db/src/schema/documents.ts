import { pgTable, uuid, text, timestamp, integer, index, uniqueIndex } from "drizzle-orm/pg-core";
import { tenants } from "./tenants.js";
import { knowledgeBases } from "./knowledge-bases.js";

export const documents = pgTable(
  "documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    knowledgeBaseId: uuid("knowledge_base_id")
      .notNull()
      .references(() => knowledgeBases.id, { onDelete: "cascade" }),
    source: text("source").notNull(),
    title: text("title").notNull(),
    storagePath: text("storage_path"),
    sourceUrl: text("source_url"),
    contentHash: text("content_hash").notNull(),
    contentType: text("content_type"),
    byteSize: integer("byte_size").notNull(),
    sapRelease: text("sap_release"),
    sapModule: text("sap_module"),
    language: text("language").default("pt-BR"),
    status: text("status").notNull().default("pending"),
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    tenantIdx: index("documents_tenant_idx").on(t.tenantId),
    kbIdx: index("documents_kb_idx").on(t.knowledgeBaseId),
    statusIdx: index("documents_status_idx").on(t.status),
    tenantHashIdx: uniqueIndex("documents_tenant_hash_idx").on(t.tenantId, t.contentHash),
  }),
);

export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
