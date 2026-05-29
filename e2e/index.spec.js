const { test, expect } = require('@playwright/test');
const path = require('path');

test('index.html loads and has expected title/text', async ({ page }) => {
  const filePath = path.resolve(__dirname, '..', 'index.html');
  const url = 'file://' + filePath.replaceAll('\\\\', '/');
  await page.goto(url);

  // check title element or presence of hero image alt text
  const title = await page.title();
  expect(title).toBeTruthy();

  // basic content check: look for a main element or hero image
  const main = await page.$('main');
  expect(main).not.toBeNull();
});
