const { test, expect } = require('@playwright/test');

const MOCK_SUMMARY = 'To jest podsumowanie pisma.';
const MOCK_POINTS = '- Ważny punkt pierwszy\n- Ważny punkt drugi';
const MOCK_STEPS = '1. Zrób krok pierwszy\n2. Zrób krok drugi';
const MOCK_EXPLANATION = `${MOCK_SUMMARY}\n\n**Najważniejsze punkty:**\n${MOCK_POINTS}\n\n**Co robić:**\n${MOCK_STEPS}`;

test.describe('Przepływ wyjaśniania — API', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/api/explain', async (route) => {
      const request = route.request();
      const headers = request.headers();
      const isExtractOnly = headers['x-extract-only'] === '1';

      if (isExtractOnly) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            extractedText: 'Tekst wyodrębniony z pliku przez OCR.',
          }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          explanation: MOCK_EXPLANATION,
          usedModel: 'gpt-4o-mini',
          usedFallback: false,
        }),
      });
    });

    await page.goto('/');
  });

  test('powinien wyświetlić status "Wysyłanie do serwera..." podczas wysyłania', async ({ page }) => {
    await page.locator('[data-testid="documentText"]').fill('Treść pisma urzędowego do wyjaśnienia.');
    await page.locator('[data-testid="freeButton"]').click();
    await expect(page.locator('[data-testid="statusMessage"]')).toContainText('Wysyłanie do serwera');
  });

  test('powinien wyłączyć przycisk "Wyjaśnij" podczas wysyłania', async ({ page }) => {
    await page.route('**/api/explain', async (route) => {
      await new Promise(r => setTimeout(r, 300));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ explanation: 'Test' }),
      });
    });

    await page.locator('[data-testid="documentText"]').fill('Treść pisma.');
    await page.locator('[data-testid="freeButton"]').click();
    await expect(page.locator('[data-testid="freeButton"]')).toBeDisabled();
  });

  test('powinien zmienić tekst przycisku na "Wyjaśnianie..." podczas wysyłania', async ({ page }) => {
    await page.route('**/api/explain', async (route) => {
      await new Promise(r => setTimeout(r, 500));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ explanation: 'Test' }),
      });
    }, { times: 1 });

    await page.locator('[data-testid="documentText"]').fill('Treść pisma.');
    await page.locator('[data-testid="freeButton"]').click();
    await expect(page.locator('[data-testid="freeButton"]')).toHaveText('Wyjaśnianie...');
  });

  test('powinien ustawić aria-busy="true" podczas wysyłania', async ({ page }) => {
    await page.route('**/api/explain', async (route) => {
      await new Promise(r => setTimeout(r, 500));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ explanation: 'Test' }),
      });
    }, { times: 1 });

    await page.locator('[data-testid="documentText"]').fill('Treść pisma.');
    await page.locator('[data-testid="freeButton"]').click();
    await expect(page.locator('[data-testid="freeButton"]')).toHaveAttribute('aria-busy', 'true');
  });

  test('powinien wyświetlić kartę wyniku po udanej odpowiedzi API', async ({ page }) => {
    await page.locator('[data-testid="documentText"]').fill('Treść pisma urzędowego.');
    await page.locator('[data-testid="freeButton"]').click();

    await expect(page.locator('[data-testid="resultCard"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="resultHeading"]')).toHaveText('Wyjaśnienie');
    await expect(page.locator('[data-testid="resultText"]')).toContainText(MOCK_SUMMARY);
    await expect(page.locator('[data-testid="resultText"]')).toContainText('Ważny punkt pierwszy');
    await expect(page.locator('[data-testid="resultText"]')).toContainText('Zrób krok pierwszy');
  });

  test('powinien ukryć status i przywrócić przyciski po odpowiedzi', async ({ page }) => {
    await page.locator('[data-testid="documentText"]').fill('Treść pisma.');
    await page.locator('[data-testid="freeButton"]').click();

    await expect(page.locator('[data-testid="statusMessage"]')).not.toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="freeButton"]')).toBeEnabled();
    await expect(page.locator('[data-testid="clearButton"]')).toBeEnabled();
    await expect(page.locator('[data-testid="freeButton"]')).toHaveText('Wyjaśnij');
  });

  test('powinien wyświetlić błąd gdy API zwróci błąd', async ({ page }) => {
    await page.unroute('**/api/explain');
    await page.route('**/api/explain', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Błąd serwera' }),
      });
    });

    await page.locator('[data-testid="documentText"]').fill('Treść pisma.');
    await page.locator('[data-testid="freeButton"]').click();

    await expect(page.locator('[data-testid="errorMessage"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="errorMessage"]')).toContainText('Błąd serwera');
  });

  test('powinien obsłużyć rate limiting (429)', async ({ page }) => {
    await page.unroute('**/api/explain');
    await page.route('**/api/explain', async (route) => {
      await route.fulfill({
        status: 429,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Zbyt wiele żądań. Spróbuj ponownie za chwilę.' }),
      });
    });

    await page.locator('[data-testid="documentText"]').fill('Treść pisma.');
    await page.locator('[data-testid="freeButton"]').click();

    await expect(page.locator('[data-testid="errorMessage"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="errorMessage"]')).toContainText('Zbyt wiele żądań');
  });

  test('przycisk "Wyjaśnij" powinien być wyłączony gdy nie ma tekstu ani pliku', async ({ page }) => {
    await expect(page.locator('[data-testid="freeButton"]')).toBeDisabled();
  });

  test('powinien przywrócić przyciski po błędzie API', async ({ page }) => {
    await page.unroute('**/api/explain');
    await page.route('**/api/explain', async (route) => {
      await route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Błąd serwera' }),
      });
    });

    await page.locator('[data-testid="documentText"]').fill('Treść pisma.');
    await page.locator('[data-testid="freeButton"]').click();

    await expect(page.locator('[data-testid="freeButton"]')).toBeEnabled({ timeout: 5000 });
    await expect(page.locator('[data-testid="clearButton"]')).toBeEnabled();
    await expect(page.locator('[data-testid="freeButton"]')).toHaveText('Wyjaśnij');
  });

  test('HAPPY PATH — pełny przepływ: wpisz tekst → kliknij Wyjaśnij → zobacz wynik', async ({ page }) => {
    await page.route('**/api/explain', async (route) => {
      await new Promise(r => setTimeout(r, 300));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          explanation: MOCK_EXPLANATION,
          usedModel: 'gpt-4o-mini',
          usedFallback: false,
        }),
      });
    }, { times: 1 });

    const testText = 'Niniejszym informuję, że decyzja administracyjna została wydana.';

    await page.locator('[data-testid="documentText"]').fill(testText);
    await expect(page.locator('[data-testid="textCount"]')).toHaveText(`${testText.length} / 15000 znaków`);
    await expect(page.locator('[data-testid="freeButton"]')).toBeEnabled();

    await page.locator('[data-testid="freeButton"]').click();
    await expect(page.locator('[data-testid="statusMessage"]')).toBeVisible();
    await expect(page.locator('[data-testid="statusMessage"]')).toContainText('Wysyłanie do serwera');
    await expect(page.locator('[data-testid="freeButton"]')).toBeDisabled();
    await expect(page.locator('[data-testid="clearButton"]')).toBeDisabled();

    await expect(page.locator('[data-testid="resultCard"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="resultHeading"]')).toHaveText('Wyjaśnienie');
    await expect(page.locator('[data-testid="resultText"]')).toContainText(MOCK_SUMMARY);
    await expect(page.locator('[data-testid="resultText"]')).toContainText('Ważny punkt pierwszy');
    await expect(page.locator('[data-testid="resultText"]')).toContainText('Zrób krok pierwszy');
    await expect(page.locator('[data-testid="statusMessage"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="errorMessage"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="freeButton"]')).toBeEnabled();
    await expect(page.locator('[data-testid="clearButton"]')).toBeEnabled();
    await expect(page.locator('[data-testid="freeButton"]')).toHaveText('Wyjaśnij');
    await expect(page.locator('[data-testid="freeButton"]')).not.toHaveAttribute('aria-busy', 'true');
  });

  test('wielokrotne kliknięcia "Wyjaśnij" nie powinny wysłać wielu żądań', async ({ page }) => {
    let callCount = 0;
    await page.unroute('**/api/explain');
    await page.route('**/api/explain', async (route) => {
      callCount++;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ explanation: 'Wynik' }),
      });
    });

    await page.locator('[data-testid="documentText"]').fill('Treść pisma.');
    await page.locator('[data-testid="freeButton"]').click({ clickCount: 3 });

    await page.waitForTimeout(1000);
    expect(callCount).toBe(1);
  });
});
