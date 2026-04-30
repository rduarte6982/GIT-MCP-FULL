import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  jsonb,
  customType,
  index,
} from "drizzle-orm/pg-core";
import { tenants } from "./tenants.js";
import { knowledgeBases } from "./knowledge-bases.js";
import { documents } from "./documents.js";

const vector = (name: string, dim: number) =>
  customType<{ data: number[]; driverData: string }>({
    dataType: () => `vector(${dim})`,
    toDriver: (v) => `[${v.join(",")}]`,
    fromDriver: (v) =>
      typeof v === "string"
        ? (v.replace(/^\[|\]$/g, "").split(",").map(Number) as number[])
        : (v as number[]),
  })(name);

export const chunks = pgTable(
  "chunks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    documentId: uuid("document_id")
      .notNull()
      .references(() => documents.id, { onDelete: "cascade" }),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    knowledgeBaseId: uuid("knowledge_base_id")
      .notNull()
      .references(() => knowledgeBases.id, { onDelete: "cascade" }),
    chunkIndex: integer("chunk_index").notNull(),
    content: text("content").notNull(),
    contextPrefix: text("context_prefix"),
    sectionPath: text("section_path").array(),
    pageStart: integer("page_start"),
    pageEnd: integer("page_end"),
    tokenCount: integer("token_count").notNull(),
    sapRelease: text("sap_release"),
    sapModule: text("sap_module"),
    language: text("language").default("pt-BR"),
    embedding: vector("embedding", 1024),
    entityRefs: jsonb("entity_refs").$type<Array<{ kind: string; name: string }>>(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    docIdx: index("chunks_doc_idx").on(t.documentId),
    tenantIdx: index("chunks_tenant_idx").on(t.tenantId),
    kbIdx: index("chunks_kb_idx").on(t.knowledgeBaseId),
    sapReleaseIdx: index("chunks_sap_release_idx").on(t.sapRelease),
  }),
);

export type Chunk = typeof chunks.$inferSelect;
export type NewChunk = typeof chunks.$inferInsert;
