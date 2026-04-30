import { logger } from "@scm/observability";
import { newTraceId } from "@scm/shared/utils";

export function withTrace<T>(name: string, fn: (traceId: string) => Promise<T>): Promise<T> {
  const traceId = newTraceId();
  const t0 = performance.now();
  return fn(traceId)
    .then((result) => {
      logger.info(
        { traceId, name, durationMs: Math.round(performance.now() - t0) },
        "trace.complete",
      );
      return result;
    })
    .catch((err) => {
      logger.error(
        { traceId, name, durationMs: Math.round(performance.now() - t0), err },
        "trace.failed",
      );
      throw err;
    });
}
