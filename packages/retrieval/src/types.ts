import type { EntityRef } from "@scm/shared/schemas";

export interface RetrievedChunk {
  id: string;
  documentId: string;
  score: number;
  semanticScore: number;
  bm25Score: number;
  content: string;
  contextPrefix: string | null;
  entities: EntityRef[];
  source: {
    title: string;
    url: string | null;
    section: string[] | null;
    page: number | null;
  };
}

export interface TraceLike {
  span(name: string): { end(meta?: Record<string, unknown>): void };
  update(meta: Record<string, unknown>): void;
}
