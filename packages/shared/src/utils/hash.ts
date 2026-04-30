import { createHash } from "node:crypto";

export function sha256Hex(buffer: ArrayBuffer | Buffer | string): string {
  const h = createHash("sha256");
  if (typeof buffer === "string") h.update(buffer);
  else if (buffer instanceof ArrayBuffer) h.update(Buffer.from(buffer));
  else h.update(buffer);
  return h.digest("hex");
}
