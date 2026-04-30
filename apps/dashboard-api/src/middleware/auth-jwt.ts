import type { MiddlewareHandler } from "hono";
import { verifyJwt } from "@scm/auth";
import { AuthError } from "@scm/shared/errors";
import type { AppVariables } from "../types.js";

export const authJwtMiddleware: MiddlewareHandler<{ Variables: AppVariables }> = async (c, next) => {
  const auth = c.req.header("authorization");
  if (!auth?.startsWith("Bearer ")) throw new AuthError("missing_token");
  const token = auth.slice(7);
  const user = await verifyJwt(token);
  if (!user) throw new AuthError("invalid_token");
  c.set("userId", user.id);
  c.set("userEmail", user.email);
  await next();
};
