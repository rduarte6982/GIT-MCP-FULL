import type { ErrorHandler } from "hono";
import { isAppError } from "@scm/shared/errors";
import { logger } from "@scm/observability";
import type { ContentfulStatusCode } from "hono/utils/http-status";

export const errorMiddleware: ErrorHandler = (err, c) => {
  if (isAppError(err)) {
    return c.json(err.toJSON(), err.statusCode as ContentfulStatusCode);
  }
  logger.error({ err }, "api.unhandled.error");
  return c.json({ error: "INTERNAL_ERROR", message: "Internal server error" }, 500);
};
