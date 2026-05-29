const { test } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const baselineDir = path.resolve(__dirname, 'baseline');
if (!fs.existsSync(baselineDir)) fs.mkdirSync(baselineDir, { recursive: true });
const baselinePath = path.join(baselineDir, 'hero.png');

test('generate baseline screenshot for hero', async ({ page }) => {
  const filePath = path.resolve(__dirname, '..', 'index.html');
  const url = 'file://' + filePath.replaceAll('\\', '/');
  await page.goto(url);
  const hero = page.locator('[data-testid="header-hero"]');
  await hero.screenshot({ path: baselinePath });
});
