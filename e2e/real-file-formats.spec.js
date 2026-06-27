const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const hasApiKey = !!process.env.OPENAI_API_KEY;
const SAMPLES_DIR = path.join(__dirname, 'tmp', 'samples');

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

const existingSamples = sampleFiles.filter(f => fs.existsSync(path.join(SAMPLES_DIR, f.name)));

test.describe('REAL API — wszystkie formaty plików', () => {
  test.skip(!hasApiKey, 'OPENAI_API_KEY nie jest ustawione — pomijam');

  for (const sample of existingSamples) {
    test(`${sample.name} — wyjaśnienie przez prawdziwe API`, async ({ page }) => {
      test.setTimeout(60000);

      await page.goto('/');
      const fileBuffer = fs.readFileSync(path.join(SAMPLES_DIR, sample.name));

      await page.locator('[data-testid="documentFile"]').setInputFiles({
        name: sample.name,
        mimeType: sample.mime,
        buffer: fileBuffer,
      });

      await expect(page.locator('[data-testid="fileDetails"]')).toBeVisible({ timeout: 5000 });
      await expect(page.locator('[data-testid="fileDetails"]')).toContainText(sample.name);

      await page.waitForTimeout(500);
      await expect(page.locator('[data-testid="freeButton"]')).toBeEnabled({ timeout: 10000 });

      await page.locator('[data-testid="freeButton"]').click();
      await expect(page.locator('[data-testid="statusMessage"]')).toBeVisible({ timeout: 3000 });

      await expect(page.locator('[data-testid="resultCard"]')).toBeVisible({ timeout: 45000 });
      await expect(page.locator('[data-testid="resultHeading"]')).toHaveText('Wyjaśnienie');

      const resultText = page.locator('[data-testid="resultText"]');
      await expect(resultText).not.toBeEmpty();
      const textContent = await resultText.textContent();
      expect(textContent.length).toBeGreaterThan(30);

      await expect(page.locator('[data-testid="usedModel"]')).toBeVisible();
      const modelText = await page.locator('[data-testid="usedModel"]').textContent();
      expect(modelText).toMatch(/Użyty model:/);

      await expect(page.locator('[data-testid="statusMessage"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="errorMessage"]')).not.toBeVisible();
      await expect(page.locator('[data-testid="freeButton"]')).toBeEnabled();
      await expect(page.locator('[data-testid="freeButton"]')).toHaveText('Wyjaśnij');

      console.log(`  ✅ ${sample.name}: wyjaśnienie otrzymane (${textContent.length} znaków)`);
    });
  }
});
