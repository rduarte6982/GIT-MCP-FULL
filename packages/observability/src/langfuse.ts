import { Langfuse } from "langfuse";

let _client: Langfuse | null = null;

export function langfuse(): Langfuse {
  if (_client) return _client;
  _client = new Langfuse({
    publicKey: process.env.LANGFUSE_PUBLIC_KEY ?? "",
    secretKey: process.env.LANGFUSE_SECRET_KEY ?? "",
    baseUrl: process.env.LANGFUSE_HOST ?? "https://cloud.langfuse.com",
  });
  return _client;
}

export interface TraceMeta {
  name: string;
  userId?: string;
  metadata?: Record<string, unknown>;
  input?: unknown;
}

export function startTrace(meta: TraceMeta) {
  if (!process.env.LANGFUSE_PUBLIC_KEY) {
    return makeNoopTrace();
  }
  const trace = langfuse().trace({
    name: meta.name,
    userId: meta.userId,
    metadata: meta.metadata,
    input: meta.input,
  });

  return {
    span(name: string) {
      const span = trace.span({ name });
      return {
        end(meta?: Record<string, unknown>) {
          span.end({ output: meta });
        },
      };
    },
    update(patch: Record<string, unknown>) {
      trace.update(patch);
    },
    async flush() {
      await langfuse().flushAsync();
    },
  };
}

function makeNoopTrace() {
  return {
    span: () => ({ end: () => {} }),
    update: () => {},
    flush: async () => {},
  };
}
