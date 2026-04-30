import { eq, and } from "drizzle-orm";
import type { DbClient } from "../client.js";
import { tenants, tenantMembers } from "../schema/tenants.js";
import { knowledgeBases } from "../schema/knowledge-bases.js";

export async function findTenantBySlug(db: DbClient, slug: string) {
  const rows = await db.select().from(tenants).where(eq(tenants.slug, slug)).limit(1);
  return rows[0];
}

export async function findTenantById(db: DbClient, id: string) {
  const rows = await db.select().from(tenants).where(eq(tenants.id, id)).limit(1);
  return rows[0];
}

export async function findMember(db: DbClient, tenantId: string, userId: string) {
  const rows = await db
    .select()
    .from(tenantMembers)
    .where(and(eq(tenantMembers.tenantId, tenantId), eq(tenantMembers.userId, userId)))
    .limit(1);
  return rows[0];
}

export async function listTenantKnowledgeBaseIds(db: DbClient, tenantId: string): Promise<string[]> {
  const rows = await db
    .select({ id: knowledgeBases.id })
    .from(knowledgeBases)
    .where(eq(knowledgeBases.tenantId, tenantId));
  return rows.map((r) => r.id);
}
