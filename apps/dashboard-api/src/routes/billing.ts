import { Hono } from "hono";
import { eq } from "drizzle-orm";
import { db, tenants } from "@scm/db";
import { stripe } from "@scm/billing";
import { NotFoundError, ValidationError } from "@scm/shared/errors";
import type { AppVariables } from "../types.js";

export const billingRoute = new Hono<{ Variables: AppVariables }>()
  .get("/", async (c) => {
    const tenantId = c.get("tenantId");
    const rows = await db()
      .select({
        tier: tenants.tier,
        stripeCustomerId: tenants.stripeCustomerId,
        stripeSubscriptionId: tenants.stripeSubscriptionId,
      })
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);
    if (!rows[0]) throw new NotFoundError("tenant");
    return c.json({ data: rows[0] });
  })

  .post("/checkout", async (c) => {
    const tenantId = c.get("tenantId");
    const userEmail = c.get("userEmail");
    const body = (await c.req.json().catch(() => ({}))) as { price_id?: string };
    if (!body.price_id) throw new ValidationError("price_id required");

    const session = await stripe().checkout.sessions.create({
      mode: "subscription",
      customer_email: userEmail,
      line_items: [{ price: body.price_id, quantity: 1 }],
      client_reference_id: tenantId,
      success_url: `${process.env.DASHBOARD_URL ?? ""}/billing/success`,
      cancel_url: `${process.env.DASHBOARD_URL ?? ""}/billing/cancel`,
    });
    return c.json({ data: { url: session.url } });
  })

  .post("/portal", async (c) => {
    const tenantId = c.get("tenantId");
    const rows = await db()
      .select({ customerId: tenants.stripeCustomerId })
      .from(tenants)
      .where(eq(tenants.id, tenantId))
      .limit(1);
    const customerId = rows[0]?.customerId;
    if (!customerId) throw new ValidationError("no_customer");
    const session = await stripe().billingPortal.sessions.create({
      customer: customerId,
      return_url: `${process.env.DASHBOARD_URL ?? ""}/billing`,
    });
    return c.json({ data: { url: session.url } });
  });
