import { Hono } from "hono";
import { stripeWebhook } from "./stripe.js";

export const webhooksRoute = new Hono().route("/stripe", stripeWebhook);
