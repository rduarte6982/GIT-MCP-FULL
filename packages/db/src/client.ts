import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index.js";

export type DbClient = ReturnType<typeof createClient>;

export interface DbClientOptions {
  url: string;
  max?: number;
  idleTimeout?: number;
}

export function createClient(opts: DbClientOptions) {
  const sql = postgres(opts.url, {
    max: opts.max ?? 10,
    idle_timeout: opts.idleTimeout ?? 20,
    prepare: false,
  });
  return drizzle(sql, { schema });
}

let _db: DbClient | null = null;

export function db(): DbClient {
  if (_db) return _db;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL not set");
  _db = createClient({ url });
  return _db;
}
