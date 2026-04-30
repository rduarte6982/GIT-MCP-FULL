import { loadEnv } from "@scm/shared/config";

export const config = loadEnv();

export const transport = config.TRANSPORT;
export const port = config.MCP_PORT;
