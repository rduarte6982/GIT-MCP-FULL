import type { MiddlewareHandler } from "hono";
import { db, queries } from "@scm/db";
import { AuthError, NotFoundError } from "@scm/shared/errors";
import type { Tier, MemberRole } from "@scm/shared/schemas";
import type { AppVariables } from "../types.js";

export const tenantScopeMiddleware: MiddlewareHandler<{ Variables: AppVariables }> = async (
  c,
  next,
) => {
  const userId = c.get("userId");
  const tenantSlug = c.req.param("tenantSlug");
  if (!tenantSlug) throw new NotFoundError("tenant");

  const tenant = await queries.findTenantBySlug(db(), tenantSlug);
  if (!tenant) throw new NotFoundError("tenant");

  const member = await queries.findMember(db(), tenant.id, userId);
  if (!member) throw new AuthError("not_member");

  c.set("tenantId", tenant.id);
  c.set("tier", tenant.tier as Tier);
  c.set("memberRole", member.role as MemberRole);
  await next();
};
