import type { RetrievedChunk } from "./types.js";

const SAP_PATTERNS = [
  /\b[A-Z]{1,2}_?[A-Z0-9]{2,8}\b/g,        // tcodes / DDIC names like J1BTAX, MIRO
  /\bJ_1B[A-Z0-9_]+\b/g,                   // BR-specific includes/classes
  /\bBAPI[_A-Z0-9]+\b/g,                   // BAPI names
  /\bME[1-9]{1,2}[A-Z]?\b/g,               // ME21N etc
  /\b\d{2,4}\b/g,                          // SEFAZ rejection codes
];

export function extractTokens(query: string): Set<string> {
  const tokens = new Set<string>();
  for (const re of SAP_PATTERNS) {
    for (const match of query.matchAll(re)) {
      tokens.add(match[0].toUpperCase());
    }
  }
  return tokens;
}

export function entityBoost(chunks: RetrievedChunk[], query: string): RetrievedChunk[] {
  const tokens = extractTokens(query);
  if (tokens.size === 0) return chunks;

  return chunks
    .map((c) => {
      const matched = c.entities.filter((e) => tokens.has(e.name.toUpperCase()));
      const boost = matched.length > 0 ? 0.15 * Math.min(matched.length, 3) : 0;
      return { ...c, score: c.score + boost };
    })
    .sort((a, b) => b.score - a.score);
}
