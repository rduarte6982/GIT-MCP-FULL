import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { and, eq, isNull } from "drizzle-orm";
import { apiKeys, db } from "@scm/db";
import { generateApiKey } from "@scm/auth";
import type { AppVariables } from "../types.js";

const createKeyInput = z.object({
  name: z.string().min(1).max(100),
  expires_at: z.string().datetime().optional(),
});

export const apiKeysRoute = new Hono<{ Variables: AppVariables }>()
  .get("/", async (c) => {
    const tenantId = c.get("tenantId");
    const keys = await db()
      .select({
        id: apiKeys.id,
        name: apiKeys.name,
        prefix: apiKeys.prefix,
        lastUsedAt: apiKeys.lastUsedAt,
        expiresAt: apiKeys.expiresAt,
        createdAt: apiKeys.createdAt,
      })
      .from(apiKeys)
      .where(and(eq(apiKeys.tenantId, tenantId), isNull(apiKeys.revokedAt)));
    return c.json({ data: keys });
  })

  .post("/", zValidator("json", createKeyInput), async (c) => {
    const input = c.req.valid("json");
    const tenantId = c.get("tenantId");
    const userId = c.get("userId");

    const { fullKey, prefix, hash } = await generateApiKey();
    const inserted = await db()
      .insert(apiKeys)
      .values({
        tenantId,
        userId,
        name: input.name,
        prefix,
        keyHash: hash,
        expiresAt: input.expires_at ? new Date(input.expires_at) : null,
      })
      .returning();
    const created = inserted[0];
    if (!created) {
      return c.json({ error: "create_failed" }, 500);
    }

    return c.json(
      {
        data: { ...created, key: fullKey, keyHash: undefined },
        warning: "Esta chave não será exibida novamente. Salve em local seguro.",
      },
      201,
    );
  })

  .delete("/:id", async (c) => {
    const tenantId = c.get("tenantId");
    const id = c.req.param("id");
    await db()
      .update(apiKeys)
      .set({ revokedAt: new Date() })
      .where(and(eq(apiKeys.id, id), eq(apiKeys.tenantId, tenantId)));
    return c.body(null, 204);
  });
