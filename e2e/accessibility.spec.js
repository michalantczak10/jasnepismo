const { test, expect } = require('@playwright/test');

test.describe('Dostępność', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('powinien zawierać link "Przejdź do treści" (skip link)', async ({ page }) => {
    const skipLink = page.locator('.skip-link');
    await expect(skipLink).toBeVisible();
    await expect(skipLink).toHaveText('Przejdź do treści');
    await expect(skipLink).toHaveAttribute('href', '#app-section');
  });

  test('skip link powinien mieć poprawny href wskazujący na #app-section', async ({ page }) => {
    const skipLink = page.locator('.skip-link');
    await expect(skipLink).toHaveAttribute('href', '#app-section');
  });

  test('textarea powinien mieć powiązaną etykietę sr-only', async ({ page }) => {
    const textarea = page.locator('[data-testid="documentText"]');
    const label = page.locator('label[for="documentText"]');
    await expect(label).toHaveText('Treść pisma');
    await expect(textarea).toHaveAttribute('aria-describedby', 'textCount');
  });

  test('input pliku powinien mieć powiązaną etykietę', async ({ page }) => {
    const fileInput = page.locator('[data-testid="documentFile"]');
    const label = page.locator('[data-testid="file-upload-label"]');
    await expect(label).toBeVisible();
    await expect(fileInput).toHaveAttribute('id', 'documentFile');
  });

  test('komunikat błędu powinien mieć role="alert"', async ({ page }) => {
    await expect(page.locator('[data-testid="errorMessage"]')).toHaveAttribute('role', 'alert');
    await expect(page.locator('[data-testid="errorMessage"]')).toHaveAttribute('hidden', '');
  });

  test('komunikat statusu powinien mieć role="status" i aria-live="polite"', async ({ page }) => {
    const statusMsg = page.locator('[data-testid="statusMessage"]');
    await expect(statusMsg).toHaveAttribute('role', 'status');
    await expect(statusMsg).toHaveAttribute('aria-live', 'polite');
    await expect(statusMsg).toHaveAttribute('hidden', '');
  });

  test('modal powinien mieć poprawne atrybuty dostępności', async ({ page }) => {
    const textarea = page.locator('[data-testid="documentText"]');
    await textarea.fill('Test');
    await page.locator('[data-testid="clearButton"]').click();

    const modal = page.locator('[data-testid="confirmModal"]');
    await expect(modal).toHaveAttribute('role', 'dialog');
    await expect(modal).toHaveAttribute('aria-modal', 'true');
    await expect(modal).toHaveAttribute('aria-labelledby', 'confirmModalTitle');
    await expect(modal).not.toHaveAttribute('hidden', '');
  });

  test('przycisk "Wyjaśnij" powinien mieć atrybut aria-busy podczas ładowania', async ({ page }) => {
    await page.route('**/api/explain', async (route) => {
      await new Promise(r => setTimeout(r, 500));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ explanation: 'Test' }),
      });
    });

    await page.locator('[data-testid="documentText"]').fill('Treść pisma.');
    const freeButton = page.locator('[data-testid="freeButton"]');

    await freeButton.click();
    await expect(freeButton).toHaveAttribute('aria-busy', 'true');
    await expect(freeButton).not.toHaveAttribute('aria-busy', { timeout: 5000 });
  });

  test('nagłówki H1 i H2 powinny być obecne', async ({ page }) => {
    await expect(page.locator('h1')).toHaveCount(1);
    const h2s = page.locator('h2');
    const h2Count = await h2s.count();
    expect(h2Count).toBeGreaterThanOrEqual(5);
  });

  test('wszystkie przyciski powinny być dostępne z klawiatury', async ({ page }) => {
    const buttons = page.locator('button');
    const count = await buttons.count();
    for (let i = 0; i < count; i++) {
      const btn = buttons.nth(i);
      if (await btn.isVisible()) {
        await expect(btn).toHaveAttribute('type', 'button');
      }
    }
  });
});
