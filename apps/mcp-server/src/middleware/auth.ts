import { verifyApiKey } from "@scm/auth";
import { db, queries } from "@scm/db";
import { AuthError } from "@scm/shared/errors";
import type { Tier } from "@scm/shared/schemas";
import { redis } from "../infra/redis.js";
import type { AuthContext, McpRequestContext } from "../types.js";

const CACHE_TTL_SECONDS = 60;

export async function authMiddleware(ctx: McpRequestContext): Promise<AuthContext> {
  const header = ctx.headers?.["authorization"] ?? ctx.headers?.["Authorization"];
  const apiKey = typeof header === "string" ? header.replace(/^Bearer\s+/i, "") : null;
  if (!apiKey) throw new AuthError("missing_api_key");

  const cacheKey = `auth:${apiKey.slice(0, 16)}`;
  const cached = await redis().get(cacheKey);
  if (cached) return JSON.parse(cached) as AuthContext;

  const verified = await verifyApiKey(apiKey, db());
  if (!verified) throw new AuthError("invalid_api_key");

  const tenant = await queries.findTenantById(db(), verified.tenantId);
  if (!tenant) throw new AuthError("tenant_not_found");

  const allowedKbIds = await queries.listTenantKnowledgeBaseIds(db(), verified.tenantId);

  const result: AuthContext = {
    tenantId: verified.tenantId,
    apiKeyId: verified.apiKeyId,
    tier: tenant.tier as Tier,
    allowedKbIds,
    defaultSapRelease: tenant.metadata?.defaultSapRelease,
  };

  await redis().set(cacheKey, JSON.stringify(result), "EX", CACHE_TTL_SECONDS);
  return result;
}
