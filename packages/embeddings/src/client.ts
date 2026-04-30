import { RetrievalError } from "@scm/shared/errors";

export interface EmbedderOptions {
  url?: string;
  timeoutMs?: number;
  batchSize?: number;
}

export class EmbedderClient {
  private readonly url: string;
  private readonly timeoutMs: number;
  private readonly batchSize: number;

  constructor(opts: EmbedderOptions = {}) {
    this.url = opts.url ?? process.env.EMBEDDER_URL ?? "http://localhost:8080";
    this.timeoutMs = opts.timeoutMs ?? 60_000;
    this.batchSize = opts.batchSize ?? 32;
  }

  async embed(texts: string[]): Promise<number[][]> {
    if (texts.length === 0) return [];
    const out: number[][] = [];
    for (let i = 0; i < texts.length; i += this.batchSize) {
      const batch = texts.slice(i, i + this.batchSize);
      out.push(...(await this.requestBatch(batch)));
    }
    return out;
  }

  async embedOne(text: string): Promise<number[]> {
    const [vec] = await this.requestBatch([text]);
    if (!vec) throw new RetrievalError("embedder returned empty result");
    return vec;
  }

  private async requestBatch(batch: string[]): Promise<number[][]> {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await fetch(`${this.url}/embed`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ inputs: batch }),
        signal: controller.signal,
      });
      if (!res.ok) {
        const body = await res.text().catch(() => "");
        throw new RetrievalError(`embedder ${res.status}: ${body.slice(0, 200)}`);
      }
      const data = (await res.json()) as number[][];
      return data;
    } finally {
      clearTimeout(t);
    }
  }
}

let _client: EmbedderClient | null = null;
export function embedder(): EmbedderClient {
  if (!_client) _client = new EmbedderClient();
  return _client;
}
