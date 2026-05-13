import { createHmac } from "node:crypto";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const SECRET = process.env["PREVIEW_SECRET"];
const TTL_SECONDS = 300; // 5 minutes

export default function handler(req: VercelRequest, res: VercelResponse): void {
  if (req.method !== "GET") {
    res.status(405).end();
    return;
  }

  if (!SECRET) {
    res.status(500).json({ error: "Server misconfiguration: PREVIEW_SECRET not set" });
    return;
  }

  const exp = Math.floor(Date.now() / 1000) + TTL_SECONDS;
  const token = createHmac("sha256", SECRET).update(String(exp)).digest("hex");

  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({ token, exp });
}
