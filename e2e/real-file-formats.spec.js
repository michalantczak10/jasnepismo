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

test.describe('REAL API — multi-page PDF', () => {
  test.skip(!hasApiKey, 'OPENAI_API_KEY nie jest ustawione — pomijam');

  const multiPagePath = path.join(SAMPLES_DIR, 'test-3-strony.pdf');
  test.skip(!fs.existsSync(multiPagePath), 'test-3-strony.pdf nie istnieje');

  test('test-3-strony.pdf (3 strony) — wyjaśnienie przez prawdziwe API', async ({ page }) => {
    test.setTimeout(60000);
    await page.goto('/');

    const fileBuffer = fs.readFileSync(multiPagePath);
    await page.locator('[data-testid="documentFile"]').setInputFiles({
      name: 'test-3-strony.pdf',
      mimeType: 'application/pdf',
      buffer: fileBuffer,
    });

    await expect(page.locator('[data-testid="fileDetails"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="fileDetails"]')).toContainText('test-3-strony.pdf');

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
    console.log(`  ✅ test-3-strony.pdf: wyjaśnienie otrzymane (${textContent.length} znaków)`);
  });
});

test.describe('REAL API — multi-file upload (page1+page2+page3.pdf)', () => {
  test.skip(!hasApiKey, 'OPENAI_API_KEY nie jest ustawione — pomijam');

  const pageFiles = ['page1.pdf', 'page2.pdf', 'page3.pdf'];
  const existingPages = pageFiles.filter(n => fs.existsSync(path.join(SAMPLES_DIR, n)));
  test.skip(existingPages.length < 3, 'brak plików page1/2/3.pdf');

  test('page1+page2+page3.pdf — wyjaśnienie przez prawdziwe API', async ({ page }) => {
    test.setTimeout(60000);
    await page.goto('/');

    const fileBuffers = pageFiles.map(n => ({
      name: n,
      mimeType: 'application/pdf',
      buffer: fs.readFileSync(path.join(SAMPLES_DIR, n)),
    }));

    await page.locator('[data-testid="documentFile"]').setInputFiles(fileBuffers);

    await expect(page.locator('[data-testid="fileDetails"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="fileDetails"]')).toContainText('3 plik');
    await expect(page.locator('[data-testid="fileDetails"]')).toContainText('page1.pdf');

    // Wait for extract-only to finish and fill textarea
    const textarea = page.locator('[data-testid="documentText"]');
    await expect(textarea).not.toBeEmpty({ timeout: 15000 });

    await expect(page.locator('[data-testid="freeButton"]')).toBeEnabled({ timeout: 10000 });

    await page.locator('[data-testid="freeButton"]').click();
    await expect(page.locator('[data-testid="statusMessage"]')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('[data-testid="resultCard"]')).toBeVisible({ timeout: 45000 });
    await expect(page.locator('[data-testid="resultHeading"]')).toHaveText('Wyjaśnienie');

    const resultText = page.locator('[data-testid="resultText"]');
    await expect(resultText).not.toBeEmpty();
    const textContent = await resultText.textContent();
    expect(textContent.length).toBeGreaterThan(30);
    console.log(`  ✅ page1+page2+page3.pdf: wyjaśnienie otrzymane (${textContent.length} znaków)`);
  });
});
