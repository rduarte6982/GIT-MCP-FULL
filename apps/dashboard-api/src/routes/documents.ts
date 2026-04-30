import { Hono } from "hono";
import { and, eq } from "drizzle-orm";
import { db, documents } from "@scm/db";
import { uploadToStorage } from "@scm/auth";
import { TIER_LIMITS } from "@scm/shared/constants";
import { NotFoundError, TierLimitError, ValidationError } from "@scm/shared/errors";
import { sha256Hex } from "@scm/shared/utils";
import { enqueueIngest } from "../jobs/enqueue.js";
import type { AppVariables } from "../types.js";

export const documentsRoute = new Hono<{ Variables: AppVariables }>()
  .post("/", async (c) => {
    const tenantId = c.get("tenantId");
    const tier = c.get("tier");

    const body = await c.req.parseBody();
    const file = body.file;
    const knowledgeBaseId = body.knowledge_base_id;
    const sapRelease = body.sap_release;

    if (!(file instanceof File) || typeof knowledgeBaseId !== "string") {
      throw new ValidationError("file and knowledge_base_id required");
    }

    const buffer = await file.arrayBuffer();
    const tierLimit = TIER_LIMITS[tier].uploadBytes;
    if (file.size > tierLimit) {
      throw new TierLimitError(`upload_bytes (file ${file.size}, max ${tierLimit})`);
    }

    const hash = sha256Hex(buffer);
    const existing = await db()
      .select()
      .from(documents)
      .where(and(eq(documents.tenantId, tenantId), eq(documents.contentHash, hash)))
      .limit(1);
    if (existing[0]) {
      return c.json({ data: existing[0], deduplicated: true });
    }

    const storagePath = `tenants/${tenantId}/${hash}/${file.name}`;
    await uploadToStorage(storagePath, buffer, { contentType: file.type });

    const inserted = await db()
      .insert(documents)
      .values({
        tenantId,
        knowledgeBaseId,
        source: "customer_upload",
        title: file.name,
        storagePath,
        contentHash: hash,
        contentType: file.type || "application/octet-stream",
        byteSize: file.size,
        sapRelease: typeof sapRelease === "string" ? sapRelease : null,
        status: "pending",
      })
      .returning();
    const doc = inserted[0];
    if (!doc) throw new Error("failed to insert document");

    await enqueueIngest(doc.id);
    return c.json({ data: doc }, 202);
  })

  .get("/", async (c) => {
    const tenantId = c.get("tenantId");
    const rows = await db().select().from(documents).where(eq(documents.tenantId, tenantId));
    return c.json({ data: rows });
  })

  .get("/:id", async (c) => {
    const tenantId = c.get("tenantId");
    const id = c.req.param("id");
    const rows = await db()
      .select()
      .from(documents)
      .where(and(eq(documents.tenantId, tenantId), eq(documents.id, id)))
      .limit(1);
    if (!rows[0]) throw new NotFoundError("document");
    return c.json({ data: rows[0] });
  })

  .delete("/:id", async (c) => {
    const tenantId = c.get("tenantId");
    const id = c.req.param("id");
    await db()
      .delete(documents)
      .where(and(eq(documents.tenantId, tenantId), eq(documents.id, id)));
    return c.body(null, 204);
  });
