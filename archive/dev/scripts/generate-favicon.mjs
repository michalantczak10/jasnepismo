import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const svgPath = path.resolve(__dirname, '../public/favicon.svg');
const outDir = path.resolve(__dirname, '../public');
const sizes = [16, 32, 180, 192, 512];
const svg = fs.readFileSync(svgPath, 'utf8');

(async () => {
  for (const size of sizes) {
    const out = path.join(outDir, `favicon-${size}x${size}.png`);
    await sharp(Buffer.from(svg)).resize(size, size).png().toFile(out);
    console.log(`wrote ${out}`);
  }

  try {
    const icoOut = path.join(outDir, 'favicon.ico');
    const tmpPng = path.join(outDir, 'favicon-temp.png');
    await sharp(Buffer.from(svg)).resize(48, 48).png().toFile(tmpPng);
    await sharp(tmpPng).toFile(icoOut);
    fs.unlinkSync(tmpPng);
    console.log(`wrote ${icoOut}`);
  } catch (err) {
    console.error('ICO generation failed:', err.message);
  }

  const manifest = {
    name: 'Szkolne gazetki',
    short_name: 'Gazetki',
    icons: [
      { src: '/favicon-192x192.png', sizes: '192x192', type: 'image/png' },
      { src: '/favicon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#1d4ed8',
  };
  fs.writeFileSync(path.join(outDir, 'site.webmanifest'), JSON.stringify(manifest, null, 2) + '\n');
  console.log('wrote site.webmanifest');
})();
