import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger as honoLogger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { errorMiddleware } from "./middleware/error.js";
import { authJwtMiddleware } from "./middleware/auth-jwt.js";
import { tenantScopeMiddleware } from "./middleware/tenant-scope.js";
import * as routes from "./routes/index.js";
import type { AppVariables } from "./types.js";

export function createApp() {
  const app = new Hono<{ Variables: AppVariables }>();

  app.use("*", honoLogger());
  app.use("*", secureHeaders());

  const allowed = (process.env.ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  app.use(
    "*",
    cors({
      origin: (origin) => (allowed.length === 0 || allowed.includes(origin) ? origin : null),
      credentials: true,
    }),
  );

  app.onError(errorMiddleware);

  app.get("/health", (c) => c.json({ status: "ok", service: "dashboard-api" }));

  app.route("/webhooks", routes.webhooks);

  app.use("/api/*", authJwtMiddleware);
  app.use("/api/tenants/:tenantSlug/*", tenantScopeMiddleware);

  app.route("/api/me", routes.me);
  app.route("/api/tenants/:tenantSlug/api-keys", routes.apiKeys);
  app.route("/api/tenants/:tenantSlug/knowledge-bases", routes.knowledgeBases);
  app.route("/api/tenants/:tenantSlug/documents", routes.documents);
  app.route("/api/tenants/:tenantSlug/billing", routes.billing);
  app.route("/api/tenants/:tenantSlug/usage", routes.usage);

  return app;
}
