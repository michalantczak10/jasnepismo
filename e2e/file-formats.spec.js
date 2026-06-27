const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const SAMPLES_DIR = path.join(__dirname, 'tmp', 'samples');
const MOCK_EXPLANATION = 'To jest podsumowanie pisma.\n\n**Najważniejsze punkty:**\n- Punkt pierwszy\n- Punkt drugi\n\n**Co robić:**\n1. Krok pierwszy\n2. Krok drugi';

const sampleFiles = [
  { name: 'test.txt', mime: 'text/plain' },
  { name: 'test.pdf', mime: 'application/pdf' },
  { name: 'test.docx', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' },
  { name: 'test.odt', mime: 'application/vnd.oasis.opendocument.text' },
  { name: 'test.rtf', mime: 'application/rtf' },
  { name: 'test.doc', mime: 'application/msword' },
  { name: 'test.png', mime: 'image/png' },
  { name: 'test.jpg', mime: 'image/jpeg' },
  { name: 'test.bmp', mime: 'image/bmp' },
  { name: 'test.gif', mime: 'image/gif' },
];

// Format odczytywane lokalnie przez frontend (nie wysyłają extract-only)
const locallyReadFormats = ['.txt', '.md', '.csv'];
function isLocallyRead(name) {
  return locallyReadFormats.some(ext => name.toLowerCase().endsWith(ext));
}

// Dynamically filter only files that actually exist
const existingSamples = sampleFiles.filter(f => fs.existsSync(path.join(SAMPLES_DIR, f.name)));

test.describe('Obsługa formatów plików — upload + wyjaśnij', () => {
  for (const sample of existingSamples) {
    test(`${sample.name} — upload i wyjaśnienie`, async ({ page }) => {
      await page.route('**/api/explain', async (route) => {
        await new Promise(r => setTimeout(r, 100));
        const request = route.request();
        const headers = request.headers();
        const isExtractOnly = headers['x-extract-only'] === '1';

        if (isExtractOnly) {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ extractedText: 'Tekst wyodrębniony z pliku.' }),
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
      const fileBuffer = fs.readFileSync(path.join(SAMPLES_DIR, sample.name));

      await page.locator('[data-testid="documentFile"]').setInputFiles({
        name: sample.name,
        mimeType: sample.mime,
        buffer: fileBuffer,
      });

      await page.waitForTimeout(500);

      await expect(page.locator('[data-testid="fileDetails"]')).toBeVisible();
      await expect(page.locator('[data-testid="fileDetails"]')).toContainText(sample.name);

      if (isLocallyRead(sample.name)) {
        await page.waitForTimeout(300);
        const textarea = page.locator('[data-testid="documentText"]');
        await expect(textarea).not.toBeEmpty();
        await expect(page.locator('[data-testid="freeButton"]')).toBeEnabled();
      }

      await page.locator('[data-testid="freeButton"]').click();
      await page.waitForTimeout(50);
      await expect(page.locator('[data-testid="statusMessage"]')).toBeVisible({ timeout: 3000 });

      await expect(page.locator('[data-testid="resultCard"]')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('[data-testid="resultHeading"]')).toHaveText('Wyjaśnienie');
      await expect(page.locator('[data-testid="resultText"]')).toContainText('To jest podsumowanie pisma.');
      await expect(page.locator('[data-testid="usedModel"]')).toBeVisible();
      await expect(page.locator('[data-testid="usedModel"]')).toContainText('gpt-4o-mini');
      await expect(page.locator('[data-testid="errorMessage"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="freeButton"]')).toBeEnabled();
      await expect(page.locator('[data-testid="freeButton"]')).toHaveText('Wyjaśnij');
    });
  }
});

test.describe('Obsługa formatów plików — extract-only', () => {
  // Tylko formaty wysyłane do serwera w celu ekstrakcji
  const serverExtracted = existingSamples.filter(s => !isLocallyRead(s.name));

  for (const sample of serverExtracted) {
    test(`${sample.name} — extract-only wywołuje endpoint`, async ({ page }) => {
      let extractCalled = false;

      await page.route('**/api/explain', async (route) => {
        const request = route.request();
        const headers = request.headers();
        const isExtractOnly = headers['x-extract-only'] === '1';

        if (isExtractOnly) {
          extractCalled = true;
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ extractedText: 'Wyodrębniony tekst z pliku ' + sample.name }),
          });
          return;
        }

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ explanation: MOCK_EXPLANATION }),
        });
      });

      await page.goto('/');
      const fileBuffer = fs.readFileSync(path.join(SAMPLES_DIR, sample.name));

      await page.locator('[data-testid="documentFile"]').setInputFiles({
        name: sample.name,
        mimeType: sample.mime,
        buffer: fileBuffer,
      });

      await page.waitForTimeout(1500);
      expect(extractCalled).toBe(true);
    });
  }
});

test.describe('Odrzucanie nieobsługiwanych formatów', () => {
  test('plik .exe powinien zostać odrzucony', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-testid="documentFile"]').setInputFiles({
      name: 'virus.exe',
      mimeType: 'application/x-msdownload',
      buffer: Buffer.from('MZ\x90\x00'),
    });

    await page.waitForTimeout(300);
    await expect(page.locator('[data-testid="errorMessage"]')).toBeVisible();
    await expect(page.locator('[data-testid="errorMessage"]')).toContainText('Nieobsługiwany format');
  });

  test('plik .zip powinien zostać odrzucony', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-testid="documentFile"]').setInputFiles({
      name: 'archive.zip',
      mimeType: 'application/zip',
      buffer: Buffer.from([0x50, 0x4B, 0x03, 0x04]),
    });

    await page.waitForTimeout(300);
    await expect(page.locator('[data-testid="errorMessage"]')).toBeVisible();
    await expect(page.locator('[data-testid="errorMessage"]')).toContainText('Nieobsługiwany format');
  });

  test('zbyt duży plik (>5 MB) powinien zostać odrzucony', async ({ page }) => {
    await page.goto('/');
    const bigBuffer = Buffer.alloc(6 * 1024 * 1024);

    await page.locator('[data-testid="documentFile"]').setInputFiles({
      name: 'duzy_plik.pdf',
      mimeType: 'application/pdf',
      buffer: bigBuffer,
    });

    await page.waitForTimeout(300);
    await expect(page.locator('[data-testid="errorMessage"]')).toBeVisible();
    await expect(page.locator('[data-testid="errorMessage"]')).toContainText('Plik jest za duży');
  });
});
