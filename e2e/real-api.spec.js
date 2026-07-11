const { test, expect } = require('@playwright/test');

const hasApiKey = !!process.env.OPENAI_API_KEY;

test.describe('Prawdziwe API — E2E', () => {
  test('API /api/health powinno odpowiadać', async ({ request }) => {
    const resp = await request.get('/api/health');
    expect(resp.ok()).toBe(true);
    const body = await resp.json();
    expect(body.status).toBe('ok');
    expect(body.service).toBe('jasnepismo');
  });

  test.describe('Endpoint /api/explain (wymaga OPENAI_API_KEY)', () => {
    test.skip(!hasApiKey, 'OPENAI_API_KEY nie jest ustawione — pomijam');

    test('HAPPY PATH — REAL — wyślij pismo i zweryfikuj odpowiedź z API', async ({ page }) => {
      await page.goto('/');

      const testText = 'Szanowny Panie, niniejszym zawiadamiam, że decyzja administracyjna nr 123/2024 została wydana. Proszę o pilne rozpatrzenie sprawy.';

      await page.locator('[data-testid="documentText"]').fill(testText);
      await expect(page.locator('[data-testid="textCount"]')).toHaveText(`${testText.length} / 15000 znaków`);
      await expect(page.locator('[data-testid="freeButton"]')).toBeEnabled();

      await page.locator('[data-testid="freeButton"]').click();
      await expect(page.locator('[data-testid="statusMessage"]')).toBeVisible();
      await expect(page.locator('[data-testid="statusMessage"]')).toContainText('Wysyłanie do serwera');
      await expect(page.locator('[data-testid="freeButton"]')).toBeDisabled();

      await expect(page.locator('[data-testid="resultCard"]')).toBeVisible({ timeout: 30000 });
      await expect(page.locator('[data-testid="resultHeading"]')).toHaveText('Wyjaśnienie');

      const resultText = page.locator('[data-testid="resultText"]');
      await expect(resultText).not.toBeEmpty();
      const textContent = await resultText.textContent();
      expect(textContent.length).toBeGreaterThan(50);

      await expect(page.locator('[data-testid="statusMessage"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="errorMessage"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="freeButton"]')).toBeEnabled();
      await expect(page.locator('[data-testid="clearButton"]')).toBeEnabled();
      await expect(page.locator('[data-testid="freeButton"]')).toHaveText('Wyjaśnij');
    });

    test('REAL — wyślij plik TXT i zweryfikuj odpowiedź', async ({ page }) => {
      await page.goto('/');

      const fileContent = 'Niniejszym informuję o zmianie adresu zamieszkania. Nowy adres: ul. Polna 5, 00-001 Warszawa. Proszę o aktualizację danych w systemie.';
      const fileInput = page.locator('[data-testid="documentFile"]');
      await fileInput.setInputFiles({
        name: 'pismo.txt',
        mimeType: 'text/plain',
        buffer: Buffer.from(fileContent),
      });

      await page.waitForTimeout(500);
      await expect(page.locator('[data-testid="freeButton"]')).toBeEnabled();

      await page.locator('[data-testid="freeButton"]').click();
      await expect(page.locator('[data-testid="statusMessage"]')).toBeVisible();

      await expect(page.locator('[data-testid="resultCard"]')).toBeVisible({ timeout: 30000 });
      const resultText = page.locator('[data-testid="resultText"]');
      await expect(resultText).not.toBeEmpty();
      const textContent = await resultText.textContent();
      expect(textContent.length).toBeGreaterThan(50);
    });
  });

  test('REAL — API powinno zwrócić błąd 400 dla pustego JSON', async ({ request }) => {
    const resp = await request.post('/api/explain', {
      headers: { 'Content-Type': 'application/json' },
      data: { text: '' },
    });
    expect(resp.status()).toBe(400);
    const body = await resp.json();
    expect(body.error).toBeDefined();
    expect(body.requestId).toBeDefined();
  });
});
