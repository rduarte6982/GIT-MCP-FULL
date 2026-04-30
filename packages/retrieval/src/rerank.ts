import type { RetrievedChunk, TraceLike } from "./types.js";

export interface RerankInput {
  query: string;
  candidates: RetrievedChunk[];
  topN: number;
  trace?: TraceLike;
}

export async function rerank(input: RerankInput): Promise<RetrievedChunk[]> {
  const span = input.trace?.span("rerank");
  const apiKey = process.env.COHERE_API_KEY;
  if (!apiKey || input.candidates.length === 0) {
    span?.end({ skipped: true });
    return input.candidates.slice(0, input.topN);
  }

  try {
    const docs = input.candidates.map((c) =>
      [c.contextPrefix, c.content].filter(Boolean).join("\n\n"),
    );
    const res = await fetch("https://api.cohere.com/v2/rerank", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "rerank-multilingual-v3.0",
        query: input.query,
        documents: docs,
        top_n: input.topN,
      }),
    });
    if (!res.ok) {
      span?.end({ error: `cohere ${res.status}` });
      return input.candidates.slice(0, input.topN);
    }
    const data = (await res.json()) as {
      results: Array<{ index: number; relevance_score: number }>;
    };
    const reranked = data.results
      .map((r) => {
        const chunk = input.candidates[r.index];
        if (!chunk) return null;
        return { ...chunk, score: r.relevance_score };
      })
      .filter((c): c is RetrievedChunk => c !== null);
    span?.end({ reranked: reranked.length });
    return reranked;
  } catch (err) {
    span?.end({ error: String(err) });
    return input.candidates.slice(0, input.topN);
  }
}
