const path = require('path');
const fs = require('fs');

// Prefer programmatic Playwright API instead of relying on the CLI options
// (some CLI versions may parse flags differently). This is more robust in CI.
// Try multiple packages to be resilient to different devDependency setups
let chromium;
try {
  chromium = require('playwright').chromium;
} catch (err1) {
  try {
    chromium = require('playwright-core').chromium;
  } catch (err2) {
    try {
      const pwTest = require('@playwright/test');
      chromium = pwTest.chromium || (pwTest.playwright && pwTest.playwright.chromium);
    } catch (err3) {
      console.error(
        'Playwright not found. Please install "playwright" or "@playwright/test" as a devDependency.'
      );
      process.exit(1);
    }
  }
}

const filePath = path.resolve(__dirname, '..', 'index.html');
const url = 'file://' + filePath.replaceAll('\\', '/');
const outDir = path.resolve(__dirname, '..', 'e2e', 'baseline');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, 'hero.png');

console.log('Generating baseline screenshot to', outPath);

(async () => {
  // Run without sandbox in CI environments (GitHub Actions runner)
  const browser = await chromium.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
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
