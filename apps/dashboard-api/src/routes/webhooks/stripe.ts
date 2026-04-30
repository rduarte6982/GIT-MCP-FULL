import { Hono } from "hono";
import type Stripe from "stripe";
import { eq } from "drizzle-orm";
import { db, tenants } from "@scm/db";
import { constructEvent, mapStripeToTier } from "@scm/billing";
import { logger } from "@scm/observability";
import { redis } from "../../infra/redis.js";

export const stripeWebhook = new Hono().post("/", async (c) => {
  const sig = c.req.header("stripe-signature");
  if (!sig) return c.json({ error: "no_signature" }, 400);

  const rawBody = await c.req.text();
  let event: Stripe.Event;
  try {
    event = constructEvent(rawBody, sig);
  } catch (err) {
    logger.error({ err }, "stripe.webhook.signature_invalid");
    return c.json({ error: "invalid_signature" }, 400);
  }

  switch (event.type) {
    case "checkout.session.completed":
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const priceId = sub.items.data[0]?.price.id;
      const tier = mapStripeToTier(priceId);
      const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
      if (!customerId) break;
      await db()
        .update(tenants)
        .set({
          tier,
          stripeSubscriptionId: sub.id,
          updatedAt: new Date(),
        })
        .where(eq(tenants.stripeCustomerId, customerId));
      await redis().del(`tenant:${customerId}`);
      logger.info({ customerId, tier }, "stripe.tier.updated");
      break;
    }
    case "invoice.payment_failed": {
      logger.warn({ event: event.id }, "stripe.payment.failed");
      break;
    }
    default:
      logger.debug({ type: event.type }, "stripe.event.ignored");
  }

  return c.json({ received: true });
});
