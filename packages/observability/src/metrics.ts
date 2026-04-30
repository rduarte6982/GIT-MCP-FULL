import { logger } from "./logger.js";

export function recordDuration(name: string, durationMs: number, attrs: Record<string, unknown> = {}) {
  logger.info({ metric: name, durationMs, ...attrs }, "metric.duration");
}

export function recordCount(name: string, value = 1, attrs: Record<string, unknown> = {}) {
  logger.info({ metric: name, value, ...attrs }, "metric.count");
}

export async function timed<T>(
  name: string,
  fn: () => Promise<T>,
  attrs: Record<string, unknown> = {},
): Promise<T> {
  const t0 = performance.now();
  try {
    return await fn();
  } finally {
    recordDuration(name, performance.now() - t0, attrs);
  }
}
