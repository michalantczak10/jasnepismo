const { test, expect } = require('@playwright/test');

test.describe('Formularz — interakcje', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('textarea powinien być pusty na starcie', async ({ page }) => {
    const textarea = page.locator('[data-testid="documentText"]');
    await expect(textarea).toHaveValue('');
  });

  test('textarea powinien mieć atrybut maxlength="15000"', async ({ page }) => {
    const textarea = page.locator('[data-testid="documentText"]');
    await expect(textarea).toHaveAttribute('maxlength', '15000');
  });

  test('licznik znaków powinien pokazywać 0 / 15000 na początku', async ({ page }) => {
    await expect(page.locator('[data-testid="textCount"]')).toHaveText('0 / 15000 znaków');
  });

  test('licznik znaków powinien aktualizować się podczas pisania', async ({ page }) => {
    const textarea = page.locator('[data-testid="documentText"]');
    await textarea.fill('Testowe pismo');
    await expect(page.locator('[data-testid="textCount"]')).toHaveText('13 / 15000 znaków');
  });

  test('licznik znaków powinien pokazywać poprawną liczbę dla długiego tekstu', async ({ page }) => {
    const textarea = page.locator('[data-testid="documentText"]');
    const longText = 'A'.repeat(1234);
    await textarea.fill(longText);
    await expect(page.locator('[data-testid="textCount"]')).toHaveText('1234 / 15000 znaków');
  });

  test('przycisk "Wyjaśnij" powinien być wyłączony gdy textarea jest pusty', async ({ page }) => {
    await expect(page.locator('[data-testid="freeButton"]')).toBeDisabled();
  });

  test('przycisk "Wyjaśnij" powinien być wyłączony gdy textarea ma tylko białe znaki', async ({ page }) => {
    const textarea = page.locator('[data-testid="documentText"]');
    await textarea.fill('   ');
    await expect(page.locator('[data-testid="freeButton"]')).toBeDisabled();
  });

  test('przycisk "Wyjaśnij" powinien być włączony gdy textarea ma tekst', async ({ page }) => {
    const textarea = page.locator('[data-testid="documentText"]');
    await textarea.fill('Testowe pismo urzędowe');
    await expect(page.locator('[data-testid="freeButton"]')).toBeEnabled();
  });

  test('przycisk "Wyczyść tekst" powinien być włączony nawet gdy textarea jest pusty', async ({ page }) => {
    await expect(page.locator('[data-testid="clearButton"]')).toBeEnabled();
  });

  test('przycisk "Wyczyść tekst" powinien być włączony gdy textarea ma tekst', async ({ page }) => {
    const textarea = page.locator('[data-testid="documentText"]');
    await textarea.fill('Test');
    await expect(page.locator('[data-testid="clearButton"]')).toBeEnabled();
  });

  test('textarea powinien przyjmować polskie znaki', async ({ page }) => {
    const textarea = page.locator('[data-testid="documentText"]');
    const polishText = 'Zażółć gęślą jaźń';
    await textarea.fill(polishText);
    await expect(textarea).toHaveValue(polishText);
    await expect(page.locator('[data-testid="textCount"]')).toHaveText(`${polishText.length} / 15000 znaków`);
  });

  test('formularz nie powinien się przeładowywać strony przy naciśnięciu Enter', async ({ page }) => {
    const textarea = page.locator('[data-testid="documentText"]');
    await textarea.fill('Test');

    page.on('load', () => {
      throw new Error('Strona przeładowała się — formularz został wysłany');
    });

    await textarea.press('Enter');
    await page.waitForTimeout(500);
  });
});
