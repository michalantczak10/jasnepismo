// Robust Playwright-based baseline generator with an internal static server
const path = require('path');
const fs = require('fs');
const http = require('http');

// Prefer programmatic Playwright API instead of relying on the CLI options
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

const projectRoot = path.resolve(__dirname, '..');
const outDir = path.resolve(projectRoot, 'e2e', 'baseline');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, 'hero.png');

async function createStaticServer(root) {
  const server = http.createServer((req, res) => {
    try {
      const parsedUrl = new URL(req.url, 'http://127.0.0.1');
      let pathname = decodeURIComponent(parsedUrl.pathname);
      if (pathname === '/') pathname = '/index.html';
      // Normalize and prevent path traversal
      const safePath = path.normalize(path.join(root, pathname));
      if (!safePath.startsWith(root)) {
        res.statusCode = 403;
        res.end('Forbidden');
        return;
      }
      let stat;
      try {
        stat = fs.statSync(safePath);
      } catch (err) {
        res.statusCode = 404;
        res.end('Not found');
        return;
      }
      let filePath = safePath;
      if (stat.isDirectory()) {
        filePath = path.join(safePath, 'index.html');
        try {
          stat = fs.statSync(filePath);
        } catch (err) {
          res.statusCode = 404;
          res.end('Not found');
          return;
        }
      }
      const ext = path.extname(filePath).toLowerCase();
      const types = {
        '.html': 'text/html; charset=utf-8',
        '.js': 'application/javascript; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.svg': 'image/svg+xml',
        '.json': 'application/json; charset=utf-8',
        '.txt': 'text/plain; charset=utf-8',
        '.ico': 'image/x-icon',
        '.woff2': 'font/woff2',
        '.woff': 'font/woff',
      };
      res.setHeader('Content-Type', types[ext] || 'application/octet-stream');
      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
      stream.on('error', () => {
        res.statusCode = 500;
        res.end('Server error');
      });
    } catch (err) {
      res.statusCode = 500;
      res.end('Server error');
    }
  });
  return new Promise((resolve, reject) => {
    server.listen(0, '127.0.0.1', () => {
      resolve({ server, port: server.address().port });
    });
    server.on('error', reject);
  });
}

console.log('Generating baseline screenshot to', outPath);

(async () => {
  let serverObj;
  let browser;
  try {
    serverObj = await createStaticServer(projectRoot);
    const { server, port } = serverObj;
    const url = `http://127.0.0.1:${port}/index.html`;

    // Launch Chromium in CI-friendly mode
    browser = await chromium.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    try {
      const context = await browser.newContext({
        viewport: { width: 1280, height: 900 },
        deviceScaleFactor: 1,
      });
      const page = await context.newPage();

      page.on('console', (msg) => console.log('PAGE LOG', msg.type(), msg.text()));
      page.on('pageerror', (err) => console.error('PAGE ERROR', err.message));
      page.on('requestfailed', (req) =>
        console.warn('REQUEST FAILED', req.url(), req.failure() && req.failure().errorText)
      );

      console.log('Navigating to', url);
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

      // Disable animations for a stable screenshot
      await page.addStyleTag({
        content: '* { transition: none !important; animation: none !important; }',
      });
      // When animations are disabled, some elements (e.g. .hero-copy, .hero-image)
      // may remain at their CSS initial state (opacity: 0). Force the final
      // visible state for those elements so screenshots include text and CTAs.
      await page.addStyleTag({
        content:
          '.hero-copy, .hero-image, .fade-in, .hero, header, section, .section { opacity: 1 !important; transform: none !important; visibility: visible !important; }',
      });

      // Wait for fonts to load if supported
      try {
        await page.evaluate(() =>
          document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve()
        );
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
            console.warn(
              `Selector ${selector} not found (attempt ${attempt}) - capturing full page`
            );
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
      // close server
      await new Promise((res) => server.close(res));
      process.exit(0);
    } catch (err) {
      console.error('Failed to generate baseline:', err);
      try {
        if (browser) await browser.close();
      } catch (e) {
        console.error('Error closing browser after failure:', e);
      }
      try {
        await new Promise((res) => server.close(res));
      } catch (e) {
        console.error('Error closing server after failure:', e);
      }
      process.exit(1);
    }
  } catch (err) {
    console.error('Failed to start static server:', err);
    if (serverObj && serverObj.server) {
      try {
        await new Promise((res) => serverObj.server.close(res));
      } catch (e) {
        console.error('Error closing server during cleanup:', e && e.message ? e.message : e);
      }
    }
    process.exit(1);
  }
})();
