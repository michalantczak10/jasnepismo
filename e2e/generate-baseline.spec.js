const { test, expect } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const baselineDir = path.resolve(__dirname, 'baseline');
if (!fs.existsSync(baselineDir)) fs.mkdirSync(baselineDir, { recursive: true });
const baselinePath = path.join(baselineDir, 'hero.png');

test('generate baseline screenshots for key UI elements', async ({ page }) => {
  const filePath = path.resolve(__dirname, '..', 'index.html');
  const url = 'file://' + filePath.replaceAll('\\', '/');
  await page.goto(url);

  // ensure result card has content
  await page.evaluate(() => {
    const rc = document.getElementById('resultCard');
    if (rc) {
      rc.hidden = false;
      const rt = document.getElementById('resultText');
      if (rt) rt.textContent = 'Przykładowe wyjaśnienie (baseline)';
    }
  });

  const elements = [
    { selector: '[data-testid="header-hero"]', name: 'hero', viewport: null },
    {
      selector: '[data-testid="header-hero"]',
      name: 'hero_mobile',
      viewport: { width: 375, height: 812 },
    },
    { selector: '[data-testid="form-explain"]', name: 'form', viewport: null },
    { selector: '[data-testid="resultCard"]', name: 'result', viewport: null },
    { selector: '[data-testid="site-footer"]', name: 'footer', viewport: null },
    { selector: '[data-testid="confirmModal"]', name: 'modal', viewport: null, open: true },
    { selector: '.file-upload-row', name: 'upload', viewport: null },
    { selector: '[data-testid="resultText"]', name: 'result_long', viewport: null, long: true },
  ];

  for (const el of elements) {
    if (el.viewport) {
      await page.setViewportSize(el.viewport);
    } else {
      await page.setViewportSize({ width: 1280, height: 720 });
    }

    if (el.open) {
      // ensure clear button is enabled by filling textarea
      const textarea = page.locator('[data-testid="documentText"]');
      await textarea.fill('Baseline temporary text');
      await expect(page.locator('[data-testid="clearButton"]')).toBeEnabled();
      // open modal
      await page.click('[data-testid="clearButton"]');
      await page.waitForSelector('[data-testid="confirmModal"]', { state: 'visible' });
    }

    const outPath = path.join(baselineDir, `${el.name}.png`);
    const node = page.locator(el.selector);
    if (el.long) {
      // enforce fixed size for long content to have consistent screenshots
      await page.evaluate(() => {
        const rt = document.getElementById('resultText');
        if (rt) {
          rt.style.width = '600px';
          rt.style.height = '400px';
          rt.style.overflow = 'auto';
          rt.style.display = 'block';
        }
      });
    }
    await node.screenshot({ path: outPath });
    console.log('Generated baseline:', outPath);

    if (el.open) {
      // close modal
      await page.click('[data-testid="cancelClearButton"]');
      await page.waitForSelector('[data-testid="confirmModal"]', { state: 'hidden' });
    }
  }
});
