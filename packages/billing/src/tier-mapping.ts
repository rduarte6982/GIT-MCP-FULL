import type { Tier } from "@scm/shared/schemas";

export function mapStripeToTier(priceId: string | undefined): Tier {
  if (!priceId) return "free";
  if (priceId === process.env.STRIPE_PRICE_BASE) return "base";
  if (priceId === process.env.STRIPE_PRICE_PRO) return "pro";
  if (priceId === process.env.STRIPE_PRICE_TEAM) return "team";
  return "free";
}
