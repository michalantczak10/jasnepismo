const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');
const { PNG } = require('pngjs');
const pixelmatch = require('pixelmatch');

const baselineDir = path.resolve(__dirname, 'baseline');
const tmpDir = path.resolve(__dirname, 'tmp');
if (!fs.existsSync(baselineDir)) fs.mkdirSync(baselineDir, { recursive: true });
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

const baselinePath = path.join(baselineDir, 'hero.png');
const tmpPath = path.join(tmpDir, 'hero.png');
const diffPath = path.join(tmpDir, 'hero-diff.png');

test('visual: hero snapshot matches baseline', async ({ page }) => {
  const filePath = path.resolve(__dirname, '..', 'index.html');
  const url = 'file://' + filePath.replaceAll('\\', '/');
  await page.goto(url);

  const hero = page.locator('[data-testid="header-hero"]');
  await expect(hero).toBeVisible();
  await hero.screenshot({ path: tmpPath });

  if (!fs.existsSync(baselinePath)) {
    if (process.env.UPDATE_BASELINE === '1') {
      fs.copyFileSync(tmpPath, baselinePath);
      console.log('Baseline image created at', baselinePath);
      return;
    }
    throw new Error(
      `Baseline image not found. Run with UPDATE_BASELINE=1 to create baseline at ${baselinePath}`
    );
  }

  const img1 = PNG.sync.read(fs.readFileSync(baselinePath));
  const img2 = PNG.sync.read(fs.readFileSync(tmpPath));

  if (img1.width !== img2.width || img1.height !== img2.height) {
    throw new Error('Baseline and screenshot dimensions differ. Regenerate baseline.');
  }

  const diff = new PNG({ width: img1.width, height: img1.height });
  const mismatches = pixelmatch(img1.data, img2.data, diff.data, img1.width, img1.height, {
    threshold: 0.1,
  });

  if (mismatches > 0) {
    fs.writeFileSync(diffPath, PNG.sync.write(diff));
    throw new Error(`Visual mismatch: ${mismatches} pixels differ. See diff: ${diffPath}`);
  }
});
