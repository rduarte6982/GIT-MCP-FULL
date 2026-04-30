import { hybridSearch } from "@scm/retrieval";
import { goldenSetBR } from "./golden-set.js";
import { aggregate, evaluateItem } from "./metrics.js";

const TENANT_ID = process.env.EVAL_TENANT_ID;
const PRECISION_THRESHOLD = Number(process.env.EVAL_PRECISION_THRESHOLD ?? "0.75");
const RECALL_THRESHOLD = Number(process.env.EVAL_RECALL_THRESHOLD ?? "0.70");

async function main() {
  if (!TENANT_ID) throw new Error("EVAL_TENANT_ID not set");
  const results = [];
  for (const item of goldenSetBR) {
    const retrieved = await hybridSearch({
      query: item.query,
      tenantId: TENANT_ID,
      sapRelease: item.sapRelease,
      topK: 8,
    });
    results.push(
      evaluateItem(
        item,
        retrieved.map((r) => ({
          documentId: r.documentId,
          documentTitle: r.source.title,
          score: r.score,
        })),
      ),
    );
  }
  const agg = aggregate(results);
  console.log(JSON.stringify({ aggregate: agg, items: results }, null, 2));

  if (agg.contextPrecision < PRECISION_THRESHOLD) {
    console.error(`FAIL precision: ${agg.contextPrecision} < ${PRECISION_THRESHOLD}`);
    process.exit(1);
  }
  if (agg.contextRecall < RECALL_THRESHOLD) {
    console.error(`FAIL recall: ${agg.contextRecall} < ${RECALL_THRESHOLD}`);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
