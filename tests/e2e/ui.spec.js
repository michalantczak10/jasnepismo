const { test, expect } = require('@playwright/test');

test.describe('form interaction', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      const origFetch = window.fetch;
      window.fetch = (input, init) => {
        const url = typeof input === 'string' ? input : (input && input.url) || '';
        if (url && url.includes('/api/explain')) {
          const body = {
            explanation: 'Testowe wyjaśnienie',
            usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
          };
          return Promise.resolve(
            new Response(JSON.stringify(body), {
              status: 200,
              headers: { 'Content-Type': 'application/json' },
            })
          );
        }
        return origFetch(input, init);
      };
    });
    await page.goto(`file://${process.cwd()}/index.html`);
  });

  test('file input shows file details and enables remove button', async ({ page }) => {
    const fileInput = page.locator('[data-testid="documentFile"]');
    await expect(fileInput).toHaveCount(1);

    await fileInput.setInputFiles({
      name: 'hello.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Hello world'),
    });

    await page.waitForFunction(() => {
      const el = document.querySelector('[data-testid="documentFile"]');
      return el && el.files && el.files.length === 1;
    });

    const uploadedName = await page.evaluate(() => {
      const el = document.querySelector('[data-testid="documentFile"]');
      return el && el.files && el.files[0] ? el.files[0].name : '';
    });
    expect(uploadedName).toBe('hello.txt');

    const removeBtn = page.locator('[data-testid="removeFileButton"]');
    await expect(removeBtn).toBeEnabled();

    const fileDetails = page.locator('[data-testid="fileDetails"]');
    await expect(fileDetails).not.toBeHidden();
  });

  test('remove file button clears the file input', async ({ page }) => {
    const fileInput = page.locator('[data-testid="documentFile"]');
    await fileInput.setInputFiles({
      name: 'hello.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Hello world'),
    });
    await page.waitForFunction(() => {
      const el = document.querySelector('[data-testid="documentFile"]');
      return el && el.files && el.files.length === 1;
    });

    const removeBtn = page.locator('[data-testid="removeFileButton"]');
    await removeBtn.click();

    await expect(removeBtn).toBeDisabled();
    const fileDetails = page.locator('[data-testid="fileDetails"]');
    await expect(fileDetails).toBeHidden();
  });

  test('clear button opens confirmation modal', async ({ page }) => {
    const clearBtn = page.locator('[data-testid="clearButton"]');
    await clearBtn.click();
    const confirmModal = page.locator('[data-testid="confirmModal"]');
    await expect(confirmModal).toBeVisible();
  });

  test('cancel button hides confirmation modal', async ({ page }) => {
    const clearBtn = page.locator('[data-testid="clearButton"]');
    await clearBtn.click();
    const cancelClearBtn = page.locator('[data-testid="cancelClearButton"]');
    await cancelClearBtn.click();
    const confirmModal = page.locator('[data-testid="confirmModal"]');
    await expect(confirmModal).toBeHidden();
  });

  test('confirm clear button clears text and hides modal', async ({ page }) => {
    const textarea = page.locator('[data-testid="documentText"]');
    await textarea.fill('Testowy tekst');
    const clearBtn = page.locator('[data-testid="clearButton"]');
    await clearBtn.click();
    const confirmClearBtn = page.locator('[data-testid="confirmClearButton"]');
    await confirmClearBtn.click();
    const confirmModal = page.locator('[data-testid="confirmModal"]');
    await expect(confirmModal).toBeHidden();
    await expect(textarea).toHaveValue('');
  });

  test('explain flow with mocked fetch shows result', async ({ page }) => {
    const textarea = page.locator('[data-testid="documentText"]');
    await textarea.fill('Testowy tekst');
    const explainBtn = page.locator('[data-testid="freeButton"]');
    await explainBtn.click();
    const resultCard = page.locator('[data-testid="resultCard"]');
    await expect(resultCard).toBeVisible();
    const resultText = page.locator('[data-testid="resultText"]');
    await expect(resultText).toContainText('Testowe wyjaśnienie');
  });

  test('character count updates when typing', async ({ page }) => {
    const textarea = page.locator('[data-testid="documentText"]');
    const textCount = page.locator('[data-testid="textCount"]');
    await expect(textCount).toContainText('0 / 5000');
    await textarea.fill('abc');
    await expect(textCount).toContainText('3 / 5000');
    await textarea.fill('');
    await expect(textCount).toContainText('0 / 5000');
  });

  test('submit button is disabled when textarea is empty', async ({ page }) => {
    const explainBtn = page.locator('[data-testid="freeButton"]');
    await expect(explainBtn).toBeDisabled();
    const textarea = page.locator('[data-testid="documentText"]');
    await textarea.fill('some text');
    await expect(explainBtn).toBeEnabled();
    await textarea.fill('');
    await expect(explainBtn).toBeDisabled();
  });

  test('textarea respects maxlength', async ({ page }) => {
    const textarea = page.locator('[data-testid="documentText"]');
    const maxlength = await textarea.getAttribute('maxlength');
    expect(maxlength).toBe('5000');
  });
});
