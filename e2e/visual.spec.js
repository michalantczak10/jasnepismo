const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');
const { PNG } = require('pngjs');
// pixelmatch v7 may export as a default property when required from CommonJS
const _pixelmatch = require('pixelmatch');
const pixelmatch = _pixelmatch && _pixelmatch.default ? _pixelmatch.default : _pixelmatch;

const baselineDir = path.resolve(__dirname, 'baseline');
const tmpDir = path.resolve(__dirname, 'tmp');
if (!fs.existsSync(baselineDir)) fs.mkdirSync(baselineDir, { recursive: true });
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

const tests = [
  { name: 'hero', selector: '[data-testid="header-hero"]' },
  {
    name: 'hero_mobile',
    selector: '[data-testid="header-hero"]',
    viewport: { width: 375, height: 812 },
  },
  { name: 'form', selector: '[data-testid="form-explain"]' },
  { name: 'result', selector: '[data-testid="resultCard"]' },
  { name: 'footer', selector: '[data-testid="site-footer"]' },
  { name: 'modal', selector: '[data-testid="confirmModal"]', open: true },
  { name: 'upload', selector: '.file-upload-row' },
  { name: 'result_long', selector: '[data-testid="resultText"]', long: true },
];

test.describe('visual regression', () => {
  for (const t of tests) {
    test(`visual: ${t.name} matches baseline`, async ({ page }) => {
      const filePath = path.resolve(__dirname, '..', 'index.html');
      const url = 'file://' + filePath.replaceAll('\\', '/');
      await page.goto(url);

      // prepare content for result/modal if needed
      await page.evaluate(() => {
        const rc = document.getElementById('resultCard');
        if (rc) {
          rc.hidden = false;
          const rt = document.getElementById('resultText');
          if (rt) rt.textContent = 'Przykładowe wyjaśnienie (baseline)';
        }
      });

      if (t.viewport) await page.setViewportSize(t.viewport);
      else await page.setViewportSize({ width: 1280, height: 720 });

      if (t.open) {
        // ensure clear button is enabled
        const textarea = page.locator('[data-testid="documentText"]');
        await textarea.fill('Baseline temporary text');
        await page.locator('[data-testid="clearButton"]').waitFor({ state: 'visible' });
        await page.locator('[data-testid="clearButton"]').waitFor({ state: 'attached' });
        // click
        await page.click('[data-testid="clearButton"]');
        await page.waitForSelector('[data-testid="confirmModal"]', { state: 'visible' });
      }

      const baselinePath = path.join(baselineDir, `${t.name}.png`);
      const tmpPath = path.join(tmpDir, `${t.name}.png`);
      const diffPath = path.join(tmpDir, `${t.name}-diff.png`);

      const node = page.locator(t.selector);
      await expect(node).toBeVisible();

      if (t.long) {
        // put long content into resultText for consistent snapshot
        await page.evaluate(() => {
          const rt = document.getElementById('resultText');
          if (rt) rt.textContent = Array(40).fill('Długi przykładowy tekst.').join('\n');
          if (rt) {
            rt.style.width = '600px';
            rt.style.height = '400px';
            rt.style.overflow = 'auto';
            rt.style.display = 'block';
          }
        });
      }

      await node.screenshot({ path: tmpPath });

      if (!fs.existsSync(baselinePath)) {
        if (process.env.UPDATE_BASELINE === '1') {
          fs.copyFileSync(tmpPath, baselinePath);
          console.log('Baseline image created at', baselinePath);
          return;
        }
        throw new Error(
          `Baseline image not found for ${t.name}. Run with UPDATE_BASELINE=1 to create baseline at ${baselinePath}`
        );
      }

      const img1 = PNG.sync.read(fs.readFileSync(baselinePath));
      const img2 = PNG.sync.read(fs.readFileSync(tmpPath));

      if (img1.width !== img2.width || img1.height !== img2.height) {
        throw new Error('Baseline and screenshot dimensions differ. Regenerate baseline.');
      }

      const diff = new PNG({ width: img1.width, height: img1.height });
      const threshold = t.name === 'result_long' ? 0.25 : 0.12;
      const mismatches = pixelmatch(img1.data, img2.data, diff.data, img1.width, img1.height, {
        threshold,
      });

      if (mismatches > 0) {
        fs.writeFileSync(diffPath, PNG.sync.write(diff));

        // allowed per-test pixel tolerances for unstable render targets
        const allowedPerTest = {
          hero_mobile: 15000,
          form: 40000,
          result: 7000,
        };

        // allow a certain number of differing pixels for long text snapshots (rendering differences)
        if (t.name === 'result_long') {
          const allowed = 7000; // pixels
          if (mismatches <= allowed) {
            console.warn(
              `Visual differences for ${t.name} (${mismatches} pixels) are within allowed threshold (${allowed}).`
            );
          } else {
            throw new Error(
              `Visual mismatch for ${t.name}: ${mismatches} pixels differ (allowed ${allowed}). See diff: ${diffPath}`
            );
          }
        } else if (allowedPerTest[t.name] && mismatches <= allowedPerTest[t.name]) {
          console.warn(
            `Visual differences for ${t.name} (${mismatches} pixels) are within allowed threshold (${allowedPerTest[t.name]}).`
          );
        } else {
          throw new Error(
            `Visual mismatch for ${t.name}: ${mismatches} pixels differ. See diff: ${diffPath}`
          );
        }
      }

      if (t.open) {
        await page.click('[data-testid="cancelClearButton"]');
        await page.waitForSelector('[data-testid="confirmModal"]', { state: 'hidden' });
      }
    });
  }
});
