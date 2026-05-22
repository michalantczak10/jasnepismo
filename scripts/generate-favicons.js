const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');
const pngToIco = require('png-to-ico');

const root = path.resolve(__dirname, '..');
const svgFile = path.join(root, 'favicon.svg');

const outputs = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'favicon-192x192.png', size: 192 },
  { name: 'favicon-512x512.png', size: 512 }
];

async function buildPngs() {
  const pngBuffers = [];
  for (const { name, size } of outputs) {
    const buffer = await sharp(svgFile)
      .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toBuffer();

    await fs.writeFile(path.join(root, name), buffer);
    if (size <= 48) {
      pngBuffers.push(buffer);
    }
  }
  return pngBuffers;
}

async function buildIco(pngBuffers) {
  const icoBuffer = await pngToIco(pngBuffers);
  await fs.writeFile(path.join(root, 'favicon.ico'), icoBuffer);
}

async function run() {
  const pngBuffers = await buildPngs();
  await buildIco(pngBuffers);
  console.log('Favicony wygenerowane: favicon.ico, favicon-16x16.png, favicon-32x32.png, favicon-192x192.png, favicon-512x512.png');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
