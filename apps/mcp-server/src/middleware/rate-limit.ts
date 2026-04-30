import { Ratelimit } from "@upstash/ratelimit";
import { TIER_LIMITS } from "@scm/shared/constants";
import { TierLimitError } from "@scm/shared/errors";
import type { Tier } from "@scm/shared/schemas";
import { redis } from "../infra/redis.js";
import type { AuthContext } from "../types.js";

const limiters = new Map<Tier, Ratelimit>();

interface RedisAdapter {
  sadd: <T extends string>(key: string, ...members: T[]) => Promise<number>;
  hset: (key: string, obj: Record<string, unknown>) => Promise<number>;
  eval: (...args: unknown[]) => Promise<unknown>;
}

function getLimiter(tier: Tier): Ratelimit {
  const cached = limiters.get(tier);
  if (cached) return cached;
  const limit = TIER_LIMITS[tier].mcpQueriesPerHour;
  const limiter = new Ratelimit({
    redis: redis() as unknown as RedisAdapter,
    limiter: Ratelimit.slidingWindow(limit, "1 h"),
    analytics: false,
    prefix: `rl:mcp:${tier}`,
  });
  limiters.set(tier, limiter);
  return limiter;
}

export async function rateLimit(auth: AuthContext): Promise<void> {
  const { success, reset } = await getLimiter(auth.tier).limit(auth.tenantId);
  if (!success) {
    throw new TierLimitError(`mcp_queries (resets at ${new Date(reset).toISOString()})`);
  }
}
