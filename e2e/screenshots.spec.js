const { test } = require('@playwright/test');
const path = require('path');
const fs = require('fs');

const indexFileUrl = () => {
  const filePath = path.resolve(__dirname, '..', 'index.html');
  return 'file://' + filePath.replace(/\\\\/g, '/');
};

const outDir = path.resolve(__dirname, '..', 'test-results', 'screenshots');
fs.mkdirSync(outDir, { recursive: true });

async function take(page, name, width, height) {
  await page.setViewportSize({ width, height });
  await page.goto(indexFileUrl());
  await page.waitForLoadState('networkidle');
  const p = path.join(outDir, name);
  await page.screenshot({ path: p, fullPage: true });
  console.log('Saved', p);
}

test('desktop screenshot', async ({ page }) => {
  await take(page, 'screenshot-desktop.png', 1280, 800);
});

test('tablet screenshot', async ({ page }) => {
  await take(page, 'screenshot-tablet.png', 768, 1024);
});

test('mobile screenshot', async ({ page }) => {
  await take(page, 'screenshot-mobile.png', 375, 812);
});
