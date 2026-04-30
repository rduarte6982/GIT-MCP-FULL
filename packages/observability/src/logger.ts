import pino from "pino";

const level = process.env.LOG_LEVEL ?? "info";

export const logger = pino({
  level,
  base: { service: process.env.SERVICE_NAME ?? "sap-context-mcp" },
  timestamp: pino.stdTimeFunctions.isoTime,
  redact: {
    paths: [
      "req.headers.authorization",
      "req.headers.cookie",
      "*.apiKey",
      "*.api_key",
      "*.password",
      "*.secret",
    ],
    censor: "[REDACTED]",
  },
});

export type Logger = typeof logger;
