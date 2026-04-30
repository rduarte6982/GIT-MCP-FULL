import { Hono } from "hono";
import { and, eq, gte, sql } from "drizzle-orm";
import { db, usageEvents } from "@scm/db";
import type { AppVariables } from "../types.js";

export const usageRoute = new Hono<{ Variables: AppVariables }>().get("/", async (c) => {
  const tenantId = c.get("tenantId");
  const since = new Date(Date.now() - 30 * 86400 * 1000);
  const rows = await db()
    .select({
      kind: usageEvents.kind,
      count: sql<number>`count(*)::int`,
      tokens: sql<number>`coalesce(sum(${usageEvents.tokens}), 0)::int`,
      bytesIn: sql<number>`coalesce(sum(${usageEvents.bytesIn}), 0)::bigint`,
    })
    .from(usageEvents)
    .where(and(eq(usageEvents.tenantId, tenantId), gte(usageEvents.createdAt, since)))
    .groupBy(usageEvents.kind);
  return c.json({ data: rows, since: since.toISOString() });
});
