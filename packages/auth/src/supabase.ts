import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let _client: SupabaseClient | null = null;
let _admin: SupabaseClient | null = null;

export function supabase(): SupabaseClient {
  if (_client) return _client;
  const url = process.env.SUPABASE_URL;
  const anonKey = process.env.SUPABASE_ANON_KEY;
  if (!url || !anonKey) throw new Error("SUPABASE_URL/SUPABASE_ANON_KEY not set");
  _client = createClient(url, anonKey, { auth: { persistSession: false } });
  return _client;
}

export function supabaseAdmin(): SupabaseClient {
  if (_admin) return _admin;
  const url = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) throw new Error("SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY not set");
  _admin = createClient(url, serviceKey, { auth: { persistSession: false } });
  return _admin;
}

export interface UploadOptions {
  contentType?: string;
  bucket?: string;
}

export async function uploadToStorage(
  path: string,
  body: Buffer | ArrayBuffer | Uint8Array,
  opts: UploadOptions = {},
): Promise<void> {
  const bucket = opts.bucket ?? "documents";
  const buffer =
    body instanceof ArrayBuffer ? Buffer.from(body) : body instanceof Buffer ? body : Buffer.from(body);
  const { error } = await supabaseAdmin()
    .storage.from(bucket)
    .upload(path, buffer, {
      contentType: opts.contentType,
      upsert: true,
    });
  if (error) throw new Error(`storage upload failed: ${error.message}`);
}

export async function downloadFromStorage(
  path: string,
  bucket = "documents",
): Promise<ArrayBuffer> {
  const { data, error } = await supabaseAdmin().storage.from(bucket).download(path);
  if (error || !data) throw new Error(`storage download failed: ${error?.message ?? "no data"}`);
  return data.arrayBuffer();
}

export interface SupabaseUser {
  id: string;
  email: string;
}

export async function verifyJwt(token: string): Promise<SupabaseUser | null> {
  const { data, error } = await supabase().auth.getUser(token);
  if (error || !data.user || !data.user.email) return null;
  return { id: data.user.id, email: data.user.email };
}
