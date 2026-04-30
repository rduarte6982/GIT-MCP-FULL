import { pgTable, uuid, text, timestamp, integer, bigint, index } from "drizzle-orm/pg-core";
import { tenants } from "./tenants.js";

export const usageEvents = pgTable(
  "usage_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    apiKeyId: uuid("api_key_id"),
    kind: text("kind").notNull(),
    bytesIn: bigint("bytes_in", { mode: "number" }).default(0),
    bytesOut: bigint("bytes_out", { mode: "number" }).default(0),
    tokens: integer("tokens").default(0),
    durationMs: integer("duration_ms"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    tenantIdx: index("usage_tenant_idx").on(t.tenantId),
    kindIdx: index("usage_kind_idx").on(t.kind),
    createdIdx: index("usage_created_idx").on(t.createdAt),
  }),
);

export type UsageEvent = typeof usageEvents.$inferSelect;
export type NewUsageEvent = typeof usageEvents.$inferInsert;
