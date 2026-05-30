#!/usr/bin/env node
/* Compare generated screenshots with baseline images using pixelmatch.
   Expects the baseline reference (target branch) to be checked out at a separate path
   and passed via BASELINE_REF_DIR (relative to project root). The generator will
   be run with BASELINE_OUTDIR pointed to GENERATED_DIR (also relative to project root).
*/
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const pixelmatch = require('pixelmatch');
const PNG = require('pngjs').PNG;

const projectRoot = path.resolve(__dirname, '..');
const baselineRefDir = path.resolve(
  projectRoot,
  process.env.BASELINE_REF_DIR || path.join('e2e', 'baseline')
);
const generatedDir = path.resolve(
  projectRoot,
  process.env.GENERATED_DIR || path.join('e2e', 'baseline-generated')
);
const threshold = Number(process.env.PIXELMATCH_THRESHOLD || 0.02);

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function runGenerator(outDirRel) {
  console.log('Running baseline generator into', outDirRel);
  execSync('node scripts/generate-baseline-fixed.js', {
    stdio: 'inherit',
    env: Object.assign({}, process.env, { BASELINE_OUTDIR: outDirRel }),
  });
}

function comparePair(basePath, genPath, diffOutPath) {
  const baseBuf = fs.readFileSync(basePath);
  const genBuf = fs.readFileSync(genPath);
  const img1 = PNG.sync.read(baseBuf);
  const img2 = PNG.sync.read(genBuf);
  if (img1.width !== img2.width || img1.height !== img2.height) {
    return {
      error: 'size-mismatch',
      width1: img1.width,
      height1: img1.height,
      width2: img2.width,
      height2: img2.height,
    };
  }
  const { width, height } = img1;
  const diff = new PNG({ width, height });
  const diffPixels = pixelmatch(img1.data, img2.data, diff.data, width, height, { threshold: 0.1 });
  fs.writeFileSync(diffOutPath, PNG.sync.write(diff));
  return { diffPixels, total: width * height, width, height };
}

(async () => {
  try {
    ensureDir(generatedDir);
    // Generate into generatedDir (pass path relative to project root)
    const relGenerated = path.relative(projectRoot, generatedDir);
    runGenerator(relGenerated);

    const files = ['hero.png', 'hero@2x.png', 'hero_full.png', 'hero_full@2x.png'];
    let totalPixels = 0;
    let totalDiff = 0;
    const results = [];

    for (const f of files) {
      const baseFile = path.join(baselineRefDir, f);
      const genFile = path.join(generatedDir, f);
      const diffFile = path.join(generatedDir, `diff-${f}`);

      if (!fs.existsSync(baseFile)) {
        console.warn('Baseline missing for', f);
        results.push({ file: f, status: 'baseline-missing' });
        continue;
      }
      if (!fs.existsSync(genFile)) {
        console.warn('Generated missing for', f);
        results.push({ file: f, status: 'generated-missing' });
        continue;
      }
      const res = comparePair(baseFile, genFile, diffFile);
      if (res.error) {
        console.warn(`Compare ${f} failed:`, res);
        results.push(Object.assign({ file: f, status: 'error' }, res));
        // count as maximally different
        totalDiff += res.width1 && res.height1 ? res.width1 * res.height1 : 1;
        totalPixels += res.width1 && res.height1 ? res.width1 * res.height1 : 1;
        continue;
      }
      const ratio = res.diffPixels / res.total;
      console.log(
        `${f}: diffPixels=${res.diffPixels} total=${res.total} ratio=${(ratio * 100).toFixed(4)}% diff saved to ${diffFile}`
      );
      results.push({ file: f, status: 'ok', diffPixels: res.diffPixels, total: res.total, ratio });
      totalDiff += res.diffPixels;
      totalPixels += res.total;
    }

    const overallRatio = totalPixels === 0 ? 0 : totalDiff / totalPixels;
    console.log('Overall diff ratio:', overallRatio);
    if (overallRatio > threshold) {
      console.error(`Visual diff ${overallRatio} exceeds threshold ${threshold}`);
      process.exit(2);
    }
    console.log('Visual comparison passed (<= threshold)');
    process.exit(0);
  } catch (err) {
    console.error('Error during visual compare:', err);
    process.exit(3);
  }
})();
