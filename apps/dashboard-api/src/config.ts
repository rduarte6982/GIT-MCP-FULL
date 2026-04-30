import { loadEnv } from "@scm/shared/config";

export const config = loadEnv();
export const port = config.DASHBOARD_API_PORT;
