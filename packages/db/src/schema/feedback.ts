import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";
import { tenants } from "./tenants.js";

export const feedback = pgTable(
  "feedback",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    traceId: text("trace_id").notNull(),
    rating: text("rating").notNull(),
    comment: text("comment"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    tenantIdx: index("feedback_tenant_idx").on(t.tenantId),
    traceIdx: index("feedback_trace_idx").on(t.traceId),
  }),
);

export type Feedback = typeof feedback.$inferSelect;
export type NewFeedback = typeof feedback.$inferInsert;
