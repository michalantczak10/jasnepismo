import { createHmac, timingSafeEqual } from "node:crypto";
import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import type { VercelRequest, VercelResponse } from "@vercel/node";

const SECRET = process.env["PREVIEW_SECRET"];
const ALLOWED_FILE = /^[a-z0-9-]+-v[123]\.(?:webp|jpg)$/;
const PREVIEWS_DIR = resolve(process.cwd(), "img/previews");

function isTokenValid(token: string, exp: number): boolean {
  if (!SECRET) return false;
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (exp < nowSeconds) return false; // expired
  const expected = createHmac("sha256", SECRET).update(String(exp)).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(token, "hex"), Buffer.from(expected, "hex"));
  } catch {
    return false;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  if (req.method !== "GET") {
    res.status(405).end();
    return;
  }

  const file = String(req.query["file"] ?? "");
  const token = String(req.query["token"] ?? "");
  const exp = Number(req.query["exp"] ?? 0);

  if (!ALLOWED_FILE.test(file)) {
    res.status(400).end();
    return;
  }

  if (!isTokenValid(token, exp)) {
    res.status(403).json({ error: "Invalid or expired preview token" });
    return;
  }

  const filePath = join(PREVIEWS_DIR, file);
  if (!filePath.startsWith(PREVIEWS_DIR + "/") && filePath !== PREVIEWS_DIR) {
    res.status(403).end();
    return;
  }

  try {
    const data = await readFile(filePath);
    const contentType = file.endsWith(".webp") ? "image/webp" : "image/jpeg";
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "private, no-store");
    res.setHeader("Content-Disposition", "inline");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.status(200).send(data);
  } catch {
    res.status(404).end();
  }
}
