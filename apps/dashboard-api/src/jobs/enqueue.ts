import { Queue } from "bullmq";
import { redis } from "../infra/redis.js";

export const ingestQueue = new Queue("ingest", {
  connection: redis(),
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: "exponential", delay: 5_000 },
    removeOnComplete: { age: 3600, count: 1000 },
    removeOnFail: { age: 7 * 86400 },
  },
});

export async function enqueueIngest(documentId: string) {
  return ingestQueue.add("ingest", { documentId });
}
