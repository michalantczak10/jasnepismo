import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import sharp from "sharp";

const ROOT = resolve(process.cwd());
const STORE_PATH = resolve(ROOT, "config/store.ts");
const OUTPUT_DIR = resolve(ROOT, "img/previews");

function hashText(value) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function xmlEscape(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&apos;");
}

function getPalette(seed) {
  const palettes = [
    { bgA: "#fff6db", bgB: "#ffe2be", accent: "#b30000", ink: "#381300" },
    { bgA: "#e8f6ff", bgB: "#cde6ff", accent: "#0052a8", ink: "#0a2b4d" },
    { bgA: "#f5f1ff", bgB: "#ddd0ff", accent: "#5a2296", ink: "#281346" },
    { bgA: "#e8fff4", bgB: "#c6f3df", accent: "#12794d", ink: "#123226" },
    { bgA: "#fff1f0", bgB: "#ffd7d4", accent: "#9f1f1f", ink: "#3d1313" },
  ];

  return palettes[seed % palettes.length];
}

function createSvg({ id, name, price, variantIndex }) {
  const seed = hashText(`${id}-${variantIndex}`);
  const palette = getPalette(seed);
  const suffix = variantIndex + 1;
  const safeTitle = xmlEscape(name.slice(0, 42));

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 640" role="img" aria-label="Podglad ${safeTitle} wersja ${suffix}">
      <defs>
        <linearGradient id="g${suffix}" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${palette.bgA}" />
          <stop offset="100%" stop-color="${palette.bgB}" />
        </linearGradient>
        <pattern id="wm${suffix}" width="200" height="120" patternUnits="userSpaceOnUse" patternTransform="rotate(-20)">
          <text x="10" y="70" font-size="22" fill="rgba(0,0,0,0.14)" font-family="Arial, sans-serif" font-weight="700">PODGLAD SZKOLNE GAZETKI</text>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#g${suffix})" />
      <rect x="26" y="26" width="428" height="588" rx="24" fill="white" fill-opacity="0.84" stroke="${palette.accent}" stroke-width="4" />
      <rect x="56" y="70" width="368" height="66" rx="12" fill="${palette.accent}" fill-opacity="0.15" />
      <text x="72" y="112" fill="${palette.ink}" font-size="30" font-family="Arial, sans-serif" font-weight="800">Wersja ${suffix}</text>
      <text x="72" y="170" fill="${palette.ink}" font-size="26" font-family="Arial, sans-serif" font-weight="700">${safeTitle}</text>
      <text x="72" y="212" fill="${palette.ink}" font-size="20" font-family="Arial, sans-serif">Podglad miniatury</text>
      <text x="72" y="248" fill="${palette.ink}" font-size="20" font-family="Arial, sans-serif">Cena pakietu: ${price} zl</text>
      <rect x="72" y="286" width="336" height="220" rx="16" fill="${palette.accent}" fill-opacity="0.1" stroke="${palette.accent}" stroke-width="2" stroke-dasharray="10 7" />
      <text x="88" y="340" fill="${palette.ink}" font-size="20" font-family="Arial, sans-serif">Material podgladowy</text>
      <text x="88" y="374" fill="${palette.ink}" font-size="20" font-family="Arial, sans-serif">Niska rozdzielczosc</text>
      <text x="88" y="408" fill="${palette.ink}" font-size="20" font-family="Arial, sans-serif">Zakup wymagany</text>
      <rect width="100%" height="100%" fill="url(#wm${suffix})" />
      <rect x="0" y="552" width="480" height="88" fill="rgba(0,0,0,0.6)" />
      <text x="240" y="606" text-anchor="middle" fill="#ffffff" font-size="22" font-family="Arial, sans-serif" font-weight="700">Podglad tylko do oceny przed zakupem</text>
    </svg>
  `;
}

async function generate() {
  const storeContent = await readFile(STORE_PATH, "utf8");
  const productPattern = /\{\s*id:\s*"([^"]+)",\s*name:\s*"([^"]+)",\s*description:\s*"([^"]+)",\s*price:\s*(\d+)/g;
  const products = [];
  const seen = new Set();

  for (const match of storeContent.matchAll(productPattern)) {
    const id = match[1];
    if (seen.has(id)) continue;
    seen.add(id);
    products.push({ id, name: match[2], price: Number(match[4]) });
  }

  await mkdir(OUTPUT_DIR, { recursive: true });

  const manifest = {};

  for (const product of products) {
    manifest[product.id] = [];
    for (let variantIndex = 0; variantIndex < 3; variantIndex += 1) {
      const svg = createSvg({ ...product, variantIndex });
      const input = Buffer.from(svg);
      const variant = variantIndex + 1;
      const basename = `${product.id}-v${variant}`;

      const webpPath = resolve(OUTPUT_DIR, `${basename}.webp`);
      const jpgPath = resolve(OUTPUT_DIR, `${basename}.jpg`);

      await sharp(input)
        .resize({ width: 540, height: 720, fit: "cover" })
        .webp({ quality: 62 })
        .toFile(webpPath);

      await sharp(input)
        .resize({ width: 540, height: 720, fit: "cover" })
        .jpeg({ quality: 66, mozjpeg: true })
        .toFile(jpgPath);

      manifest[product.id].push({
        id: `${product.id}-v${variant}`,
        title: `${product.name} - Wersja ${variant}`,
        caption: `Wariant ${variant} podgladu`,
        webp: `/img/previews/${basename}.webp`,
        jpg: `/img/previews/${basename}.jpg`,
      });
    }
  }

  await writeFile(resolve(OUTPUT_DIR, "manifest.json"), JSON.stringify(manifest, null, 2), "utf8");
  console.log(`Generated ${products.length * 3 * 2} files for ${products.length} products.`);
}

generate().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
