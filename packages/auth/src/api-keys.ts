import { randomBytes, timingSafeEqual } from "node:crypto";
import { hash as argonHash, verify as argonVerify } from "@node-rs/argon2";
import { eq, and, isNull } from "drizzle-orm";
import { db, apiKeys } from "@scm/db";
import type { DbClient } from "@scm/db";

const KEY_PREFIX = "scm_";
const KEY_BYTES = 32;
const PREFIX_LENGTH = 12;

export interface GeneratedKey {
  fullKey: string;
  prefix: string;
  hash: string;
}

function getPepper(): string {
  const pepper = process.env.API_KEY_PEPPER;
  if (!pepper) throw new Error("API_KEY_PEPPER not set");
  return pepper;
}

export async function generateApiKey(): Promise<GeneratedKey> {
  const random = randomBytes(KEY_BYTES).toString("base64url");
  const fullKey = `${KEY_PREFIX}${random}`;
  const prefix = fullKey.slice(0, PREFIX_LENGTH);
  const hash = await argonHash(`${fullKey}${getPepper()}`, {
    algorithm: 2,
    memoryCost: 19_456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  });
  return { fullKey, prefix, hash };
}

export interface VerifiedKey {
  apiKeyId: string;
  tenantId: string;
}

export async function verifyApiKey(
  fullKey: string,
  client: DbClient = db(),
): Promise<VerifiedKey | null> {
  if (!fullKey.startsWith(KEY_PREFIX)) return null;
  const prefix = fullKey.slice(0, PREFIX_LENGTH);

  const candidates = await client
    .select()
    .from(apiKeys)
    .where(and(eq(apiKeys.prefix, prefix), isNull(apiKeys.revokedAt)));

  for (const candidate of candidates) {
    if (candidate.expiresAt && candidate.expiresAt < new Date()) continue;
    const ok = await argonVerify(candidate.keyHash, `${fullKey}${getPepper()}`).catch(() => false);
    if (ok) {
      return { apiKeyId: candidate.id, tenantId: candidate.tenantId };
    }
  }
  return null;
}

export function constantTimeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}
