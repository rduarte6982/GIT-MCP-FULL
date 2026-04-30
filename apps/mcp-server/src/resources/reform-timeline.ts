import type { McpResource } from "./types.js";

const URI = "sap-context://br/reforma/timeline";

const TIMELINE = {
  reforma_tributaria: {
    overview:
      "EC 132/2023 cria CBS, IBS e IS. Substituem IPI, PIS, COFINS, ICMS e ISS ao longo de período de transição 2026-2032.",
    fases: [
      { ano: 2026, marco: "Início da fase de teste — CBS e IBS com alíquotas reduzidas (0,9% e 0,1%)." },
      { ano: 2027, marco: "Extinção do PIS e COFINS. Cobrança plena da CBS. IPI mantido apenas para alguns produtos." },
      { ano: 2029, marco: "Início da redução gradual de ICMS e ISS, contrapartida ao aumento do IBS." },
      { ano: 2032, marco: "ICMS/ISS extintos; IBS plenamente vigente. Período de transição encerrado." },
      { ano: 2033, marco: "Sistema novo plenamente operacional." },
    ],
    impactos_sap: [
      "Necessário reescrever schemas de cálculo (TAXBRA → novo schema CBS/IBS).",
      "Reescrever determinação tributária para Condition-Based Tax + novas chaves.",
      "Adaptar SPED para aceitar registros novos (CBS/IBS).",
      "Migrar saldos credores de ICMS/PIS/COFINS para regimes de transição.",
    ],
  },
};

export const reformTimelineResource: McpResource = {
  uri: URI,
  name: "Timeline Reforma Tributária",
  description: "Marcos da reforma tributária (EC 132/23) e impactos previstos em SAP.",
  mimeType: "application/json",
  minTier: "enterprise",
  matches: (uri) => uri === URI,
  async read() {
    return {
      contents: [
        { uri: URI, mimeType: "application/json", text: JSON.stringify(TIMELINE, null, 2) },
      ],
    };
  },
};
