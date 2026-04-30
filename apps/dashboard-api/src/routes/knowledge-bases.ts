import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { and, eq } from "drizzle-orm";
import { db, knowledgeBases } from "@scm/db";
import { TIER_LIMITS } from "@scm/shared/constants";
import { TierLimitError, NotFoundError } from "@scm/shared/errors";
import type { AppVariables } from "../types.js";

const createInput = z.object({
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
  description: z.string().max(2000).optional(),
  visibility: z.enum(["private", "shared"]).default("private"),
});

export const knowledgeBasesRoute = new Hono<{ Variables: AppVariables }>()
  .get("/", async (c) => {
    const tenantId = c.get("tenantId");
    const rows = await db()
      .select()
      .from(knowledgeBases)
      .where(eq(knowledgeBases.tenantId, tenantId));
    return c.json({ data: rows });
  })

  .post("/", zValidator("json", createInput), async (c) => {
    const tenantId = c.get("tenantId");
    const tier = c.get("tier");
    const input = c.req.valid("json");

    const existing = await db()
      .select({ id: knowledgeBases.id })
      .from(knowledgeBases)
      .where(eq(knowledgeBases.tenantId, tenantId));
    if (existing.length >= TIER_LIMITS[tier].knowledgeBases) {
      throw new TierLimitError("knowledge_bases");
    }

    const inserted = await db()
      .insert(knowledgeBases)
      .values({
        tenantId,
        name: input.name,
        slug: input.slug,
        description: input.description,
        visibility: input.visibility,
      })
      .returning();
    return c.json({ data: inserted[0] }, 201);
  })

  .get("/:id", async (c) => {
    const tenantId = c.get("tenantId");
    const id = c.req.param("id");
    const rows = await db()
      .select()
      .from(knowledgeBases)
      .where(and(eq(knowledgeBases.tenantId, tenantId), eq(knowledgeBases.id, id)))
      .limit(1);
    if (!rows[0]) throw new NotFoundError("knowledge_base");
    return c.json({ data: rows[0] });
  });
