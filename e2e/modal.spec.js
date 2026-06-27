const { test, expect } = require('@playwright/test');

test.describe('Modal potwierdzenia wyczyszczenia', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const textarea = page.locator('[data-testid="documentText"]');
    await textarea.fill('Testowe pismo do wyczyszczenia');
  });

  test('modal powinien być domyślnie ukryty', async ({ page }) => {
    await expect(page.locator('[data-testid="confirmModal"]')).not.toBeVisible();
  });

  test('modal powinien pojawić się po kliknięciu "Wyczyść tekst"', async ({ page }) => {
    await page.locator('[data-testid="clearButton"]').click();
    await expect(page.locator('[data-testid="confirmModal"]')).toBeVisible();
  });

  test('modal powinien mieć poprawny tytuł i opis', async ({ page }) => {
    await page.locator('[data-testid="clearButton"]').click();
    await expect(page.locator('[data-testid="confirmModalTitle"]')).toHaveText('Usunąć tekst?');
    await expect(page.locator('[data-testid="confirmModalText"]')).toContainText('Czy na pewno');
  });

  test('modal powinien zawierać przyciski "Tak, wyczyść" i "Anuluj"', async ({ page }) => {
    await page.locator('[data-testid="clearButton"]').click();
    await expect(page.locator('[data-testid="confirmClearButton"]')).toHaveText('Tak, wyczyść');
    await expect(page.locator('[data-testid="confirmClearButton"]')).toBeVisible();
    await expect(page.locator('[data-testid="cancelClearButton"]')).toHaveText('Anuluj');
    await expect(page.locator('[data-testid="cancelClearButton"]')).toBeVisible();
  });

  test('przycisk "Anuluj" powinien zamknąć modal bez czyszczenia', async ({ page }) => {
    await page.locator('[data-testid="clearButton"]').click();
    await expect(page.locator('[data-testid="confirmModal"]')).toBeVisible();

    await page.locator('[data-testid="cancelClearButton"]').click();
    await expect(page.locator('[data-testid="confirmModal"]')).not.toBeVisible();

    const textarea = page.locator('[data-testid="documentText"]');
    await expect(textarea).toHaveValue('Testowe pismo do wyczyszczenia');
  });

  test('przycisk "Tak, wyczyść" powinien wyczyścić textarea i zamknąć modal', async ({ page }) => {
    await page.locator('[data-testid="clearButton"]').click();
    await expect(page.locator('[data-testid="confirmModal"]')).toBeVisible();

    await page.locator('[data-testid="confirmClearButton"]').click();
    await expect(page.locator('[data-testid="confirmModal"]')).not.toBeVisible();

    const textarea = page.locator('[data-testid="documentText"]');
    await expect(textarea).toHaveValue('');
  });

  test('"Tak, wyczyść" powinien zresetować licznik znaków do 0', async ({ page }) => {
    await page.locator('[data-testid="clearButton"]').click();
    await page.locator('[data-testid="confirmClearButton"]').click();
    await expect(page.locator('[data-testid="textCount"]')).toHaveText('0 / 5000 znaków');
  });

  test('"Tak, wyczyść" powinien wyłączyć przycisk "Wyjaśnij"', async ({ page }) => {
    await page.locator('[data-testid="clearButton"]').click();
    await page.locator('[data-testid="confirmClearButton"]').click();
    await expect(page.locator('[data-testid="freeButton"]')).toBeDisabled();
  });

  test('modal powinien mieć poprawne atrybuty ARIA', async ({ page }) => {
    await page.locator('[data-testid="clearButton"]').click();
    const modal = page.locator('[data-testid="confirmModal"]');
    await expect(modal).toHaveAttribute('role', 'dialog');
    await expect(modal).toHaveAttribute('aria-modal', 'true');
    await expect(modal).toHaveAttribute('aria-labelledby', 'confirmModalTitle');
  });
});
