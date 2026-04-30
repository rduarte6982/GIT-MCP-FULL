import IORedis, { type Redis } from "ioredis";

let _redis: Redis | null = null;

export function redis(): Redis {
  if (_redis) return _redis;
  const url = process.env.REDIS_URL ?? "redis://localhost:6379";
  _redis = new IORedis(url, { maxRetriesPerRequest: null, enableReadyCheck: true });
  return _redis;
}
