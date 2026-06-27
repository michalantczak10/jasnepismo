const { test, expect } = require('@playwright/test');

test.describe('Scenariusze brzegowe', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('textarea powinien akceptować tekst bliski limitowi 5000 znaków', async ({ page }) => {
    const textarea = page.locator('[data-testid="documentText"]');
    const longText = 'A'.repeat(4990);
    await textarea.fill(longText);
    await expect(textarea).toHaveValue(longText);
    await expect(page.locator('[data-testid="textCount"]')).toHaveText('4990 / 5000 znaków');
  });

  test('textarea nie powinien akceptować więcej niż 5000 znaków', async ({ page }) => {
    const textarea = page.locator('[data-testid="documentText"]');
    const tooLong = 'A'.repeat(6000);
    await textarea.fill(tooLong);
    const val = await textarea.inputValue();
    expect(val.length).toBeLessThanOrEqual(5000);
  });

  test('powinien wyczyścić textarea i zresetować licznik po potwierdzeniu', async ({ page }) => {
    await page.route('**/api/explain', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          explanation: 'Pierwsze wyjaśnienie',
          usedModel: 'gpt-4o-mini',
        }),
      });
    });

    await page.locator('[data-testid="documentText"]').fill('Pierwsze pismo.');
    await page.locator('[data-testid="freeButton"]').click();
    await expect(page.locator('[data-testid="resultCard"]')).toBeVisible({ timeout: 5000 });

    await page.locator('[data-testid="clearButton"]').click();
    await page.locator('[data-testid="confirmClearButton"]').click();
    await expect(page.locator('[data-testid="documentText"]')).toHaveValue('');
    await expect(page.locator('[data-testid="textCount"]')).toHaveText('0 / 5000 znaków');
  });

  test('API zwracające pustą odpowiedź nie powinno wyświetlić modelu', async ({ page }) => {
    await page.route('**/api/explain', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          explanation: 'Wyjaśnienie bez modelu.',
        }),
      });
    });

    await page.locator('[data-testid="documentText"]').fill('Treść pisma.');
    await page.locator('[data-testid="freeButton"]').click();
    await expect(page.locator('[data-testid="resultCard"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="usedModel"]')).not.toBeVisible();
  });

  test('plik i tekst łącznie — wysłanie pliku z tekstem', async ({ page }) => {
    let sentBody = null;
    await page.route('**/api/explain', async (route) => {
      sentBody = route.request().postData();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ explanation: 'Połączone wyjaśnienie' }),
      });
    });

    const textarea = page.locator('[data-testid="documentText"]');
    await textarea.fill('Dodatkowy tekst do pisma.');

    const fileInput = page.locator('[data-testid="documentFile"]');
    await fileInput.setInputFiles({
      name: 'pismo.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('PDF content'),
    });

    await page.locator('[data-testid="freeButton"]').click();
    await expect(page.locator('[data-testid="resultCard"]')).toBeVisible({ timeout: 5000 });
  });

  test('przycisk "Wyjaśnij" powinien być wyłączony po wyczyszczeniu textarea', async ({ page }) => {
    const textarea = page.locator('[data-testid="documentText"]');
    await textarea.fill('Tekst');
    await expect(page.locator('[data-testid="freeButton"]')).toBeEnabled();

    await textarea.fill('');
    await expect(page.locator('[data-testid="freeButton"]')).toBeDisabled();
  });

  test('obsługa błędu sieci — fetch rzuca wyjątkiem', async ({ page }) => {
    await page.route('**/api/explain', async (route) => {
      await route.abort('connectionrefused');
    });

    await page.locator('[data-testid="documentText"]').fill('Treść pisma.');
    await page.locator('[data-testid="freeButton"]').click();

    await expect(page.locator('[data-testid="errorMessage"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="freeButton"]')).toBeEnabled();
  });
});
