const { test, expect } = require('@playwright/test');

test.describe('Nawigacja', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('link w stopce do emaila powinien działać', async ({ page }) => {
    const emailLink = page.locator('footer a[href="mailto:kontakt@jasnepismo.pl"]');
    await expect(emailLink).toBeVisible();
    await expect(emailLink).toHaveText('kontakt@jasnepismo.pl');
  });

  test('link do polityki prywatności w regulaminie powinien prowadzić do sekcji #privacy-section', async ({ page }) => {
    const privacyLink = page.locator('[data-testid="section-terms"] a[href="#privacy-section"]');
    await expect(privacyLink).toBeVisible();
  });

  test('kanoniczny URL powinien być ustawiony', async ({ page }) => {
    const canonical = page.locator('link[rel="canonical"]');
    await expect(canonical).toHaveAttribute('href', 'https://jasnepismo.pl/');
  });

  test('strona powinna zawierać meta description', async ({ page }) => {
    const metaDesc = page.locator('meta[name="description"]');
    await expect(metaDesc).toHaveAttribute('content', /zrozumiesz|proste wyjaśnienie/);
  });

  test('strona powinna zawierać tagi Open Graph', async ({ page }) => {
    const ogTitle = page.locator('meta[property="og:title"]');
    await expect(ogTitle).toHaveAttribute('content', /Jasne pismo/);

    const ogDesc = page.locator('meta[property="og:description"]');
    await expect(ogDesc).toHaveAttribute('content', /prostym językiem/);

    const ogUrl = page.locator('meta[property="og:url"]');
    await expect(ogUrl).toHaveAttribute('content', 'https://jasnepismo.pl/');

    const ogLocale = page.locator('meta[property="og:locale"]');
    await expect(ogLocale).toHaveAttribute('content', 'pl_PL');
  });
});
