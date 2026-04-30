import type Stripe from "stripe";
import { stripe, type StripeEvent } from "./stripe.js";

export function constructEvent(rawBody: string, signature: string): StripeEvent {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) throw new Error("STRIPE_WEBHOOK_SECRET not set");
  return stripe().webhooks.constructEvent(rawBody, signature, secret);
}

export function isSubscriptionEvent(
  event: StripeEvent,
): event is StripeEvent & { data: { object: Stripe.Subscription } } {
  return (
    event.type === "checkout.session.completed" ||
    event.type === "customer.subscription.created" ||
    event.type === "customer.subscription.updated" ||
    event.type === "customer.subscription.deleted"
  );
}
