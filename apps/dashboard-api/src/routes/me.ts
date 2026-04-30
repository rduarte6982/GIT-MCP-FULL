import { Hono } from "hono";
import type { AppVariables } from "../types.js";

export const meRoute = new Hono<{ Variables: AppVariables }>().get("/", (c) => {
  return c.json({
    data: {
      id: c.get("userId"),
      email: c.get("userEmail"),
    },
  });
});
