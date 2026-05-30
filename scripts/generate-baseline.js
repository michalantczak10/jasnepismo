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
              console.error('Playwright not found. Please install "playwright" or "@playwright/test" as a devDependency.');
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
            const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1 });
            const page = await context.newPage();

            page.on('console', (msg) => console.log('PAGE LOG', msg.type(), msg.text()));
            page.on('pageerror', (err) => console.error('PAGE ERROR', err.message));
            page.on('requestfailed', (req) => console.warn('REQUEST FAILED', req.url(), req.failure() && req.failure().errorText));

            console.log('Navigating to', url);
            await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

            // Disable animations and transitions for a stable screenshot
            await page.addStyleTag({ content: '* { transition: none !important; animation: none !important; }' });

            // Wait for fonts to load if supported
            try {
              await page.evaluate(() => (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve());
            } catch (err) {
              console.warn('Fonts ready check failed:', err && err.message ? err.message : err);
            }

            const selector = '[data-testid="header-hero"]';

            let screenshotTaken = false;
            const attempts = 2;
            for (let attempt = 1; attempt <= attempts && !screenshotTaken; attempt++) {
              try {
                const elCount = await page.locator(selector).count();
                if (elCount > 0) {
                  console.log(`Capturing element ${selector} (attempt ${attempt})`);
                  await page.locator(selector).first().screenshot({ path: outPath });
                } else {
                  console.warn(`Selector ${selector} not found (attempt ${attempt}) - capturing full page`);
                  await page.screenshot({ path: outPath, fullPage: true });
                }

                // Ensure file generated and non-empty
                const stat = fs.statSync(outPath);
                if (stat && stat.size > 0) {
                  screenshotTaken = true;
                  console.log('Baseline generated:', outPath, 'size', stat.size);
                  break;
                }
                throw new Error('Screenshot file empty');
              } catch (err) {
                console.warn(`Attempt ${attempt} failed:`, err && err.message ? err.message : err);
                if (attempt < attempts) {
                  // small delay before retry
                  await new Promise((r) => setTimeout(r, 1000));
                  continue;
                }
                throw err;
              }
            }

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
