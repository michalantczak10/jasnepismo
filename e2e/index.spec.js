const { test, expect } = require('@playwright/test');

test('page loads and hero checks', async ({ page }) => {
  const path = `file://${process.cwd()}/index.html`;
  await page.goto(path);

  const heroHeading = page.locator('[data-testid="hero-heading"]');
  await expect(heroHeading).toBeVisible();
  await expect(heroHeading).toContainText('Masz pismo?');

  const freeButton = page.locator('[data-testid="freeButton"]');
  await expect(freeButton).toBeVisible();
});
