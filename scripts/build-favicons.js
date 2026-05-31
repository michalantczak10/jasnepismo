const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const featureFlags = require('../lib/feature-flags');

if (!featureFlags.isEnabled('favicons')) {
  console.log('Feature "favicons" disabled (set FEATURE_FAVICONS=0 to disable). Exiting.');
  process.exit(0);
}
// png-to-ico is ESM; import dynamically below when needed

(async () => {
  try {
    const root = path.resolve(__dirname, '..');
    const svgArg = process.argv[2] || 'favicon.svg';
    const svgPath = path.join(root, svgArg);
    if (!fs.existsSync(svgPath)) {
      console.error('SVG source not found:', svgPath);
      process.exit(1);
    }

    const sizes = [16, 32, 192, 512];
    const pngPaths = [];

    for (const s of sizes) {
      const out = path.join(root, `favicon-${s}x${s}.png`);
      const svgBuffer = fs.readFileSync(svgPath);
      await sharp(svgBuffer)
        .resize(s, s, { fit: 'contain' })
        .png({ compressionLevel: 9 })
        .toFile(out);
      console.log('Wrote', out);
      pngPaths.push(out);
    }

    // create favicon.ico from 16 and 32 variants (png-to-ico is ESM)
    const icoOut = path.join(root, 'favicon.ico');
    const pngToIcoModule = await import('png-to-ico');
    const pngToIcoFunc = pngToIcoModule.default || pngToIcoModule;
    const icoBuffer = await pngToIcoFunc([path.join(root, 'favicon-16x16.png'), path.join(root, 'favicon-32x32.png')]);
    fs.writeFileSync(icoOut, icoBuffer);
    console.log('Wrote', icoOut);

    console.log('All favicons generated successfully.');
  } catch (err) {
    console.error('Error generating favicons:', err);
    process.exit(1);
  }
})();



