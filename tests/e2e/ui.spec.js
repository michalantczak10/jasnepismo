const { test, expect } = require('@playwright/test');

test('form, modal and file input behavior', async ({ page }) => {
  // Mock /api/explain before any page scripts run
  await page.addInitScript(() => {
    const origFetch = window.fetch;
    window.fetch = (input, init) => {
      const url = typeof input === 'string' ? input : (input && input.url) || '';
      if (url && url.includes('/api/explain')) {
        const body = { explanation: 'Testowe wyjaśnienie', usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 } };
        return Promise.resolve(new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } }));
      }
      return origFetch(input, init);
    };
  });

  const path = `file://${process.cwd()}/index.html`;
  await page.goto(path);

  // File input behavior
  const fileInput = page.locator('[data-testid="documentFile"]');
  await expect(fileInput).toHaveCount(1);

  await fileInput.setInputFiles({ name: 'hello.txt', mimeType: 'text/plain', buffer: Buffer.from('Hello world') });

  // Wait for the input element to report the uploaded file (robust to hidden native input)
  await page.waitForFunction(() => {
    const el = document.querySelector('[data-testid="documentFile"]');
    return el && el.files && el.files.length === 1;
  });
  const uploadedName = await page.evaluate(() => {
    const el = document.querySelector('[data-testid="documentFile"]');
    return (el && el.files && el.files[0]) ? el.files[0].name : '';
  });
  expect(uploadedName).toBe('hello.txt');

  const removeBtn = page.locator('[data-testid="removeFileButton"]');
  await expect(removeBtn).toBeEnabled();

  // Clear button opens confirmation modal
  const clearBtn = page.locator('[data-testid="clearButton"]');
  await clearBtn.click();
  const confirmModal = page.locator('[data-testid="confirmModal"]');
  await expect(confirmModal).toBeVisible();
  const cancelClearBtn = page.locator('[data-testid="cancelClearButton"]');
  await cancelClearBtn.click();
  await expect(confirmModal).toBeHidden();

  // Explain flow (uses mocked fetch)
  const textarea = page.locator('[data-testid="documentText"]');
  await textarea.fill('Testowy tekst');
  const explainBtn = page.locator('[data-testid="freeButton"]');
  await explainBtn.click();

  const resultCard = page.locator('[data-testid="resultCard"]');
  await expect(resultCard).toBeVisible();
  const resultText = page.locator('[data-testid="resultText"]');
  await expect(resultText).toContainText('Testowe wyjaśnienie');
});
