import type { GoldenItem } from "./golden-set.js";

export interface RetrievedDocRef {
  documentId: string;
  documentTitle: string;
  score: number;
}

export interface EvalResult {
  itemId: string;
  contextPrecision: number;
  contextRecall: number;
  topKHits: number;
}

export interface AggregateResult {
  contextPrecision: number;
  contextRecall: number;
  count: number;
}

export function evaluateItem(item: GoldenItem, retrieved: RetrievedDocRef[]): EvalResult {
  const expected = new Set(item.expectedDocuments);
  const retrievedIds = retrieved.map((r) => r.documentTitle);
  const hits = retrievedIds.filter((d) => expected.has(d)).length;

  const precision = retrieved.length === 0 ? 0 : hits / retrieved.length;
  const recall = expected.size === 0 ? 1 : hits / expected.size;

  return {
    itemId: item.id,
    contextPrecision: precision,
    contextRecall: recall,
    topKHits: hits,
  };
}

export function aggregate(results: EvalResult[]): AggregateResult {
  if (results.length === 0) return { contextPrecision: 0, contextRecall: 0, count: 0 };
  const sumP = results.reduce((s, r) => s + r.contextPrecision, 0);
  const sumR = results.reduce((s, r) => s + r.contextRecall, 0);
  return {
    contextPrecision: sumP / results.length,
    contextRecall: sumR / results.length,
    count: results.length,
  };
}
