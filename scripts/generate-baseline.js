const path = require('path');
const fs = require('fs');

// Prefer programmatic Playwright API instead of relying on the CLI options
// (some CLI versions may parse flags differently). This is more robust in CI.
const { chromium } = require('playwright');

const filePath = path.resolve(__dirname, '..', 'index.html');
const url = 'file://' + filePath.replaceAll('\\', '/');
const outDir = path.resolve(__dirname, '..', 'e2e', 'baseline');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, 'hero.png');

console.log('Generating baseline screenshot to', outPath);

(async () => {
  const browser = await chromium.launch();
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto(url, { waitUntil: 'networkidle' });

    const selector = '[data-testid="header-hero"]';
    const el = page.locator(selector);
    const count = await el.count();
    if (count === 0) {
      console.warn(`Selector ${selector} not found - falling back to full page screenshot`);
      await page.screenshot({ path: outPath, fullPage: true });
    } else {
      console.log(`Capturing element ${selector}`);
      await el.first().screenshot({ path: outPath });
    }
    console.log('Baseline generated.');
    await browser.close();
    process.exit(0);
  } catch (err) {
    console.error('Failed to generate baseline:', err);
    try {
      await browser.close();
    } catch (e) {
      console.error('Error closing browser after failure:', e);
    }
    process.exit(1);
  }
})();
