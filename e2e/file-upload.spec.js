const { test, expect } = require('@playwright/test');

test.describe('Przesyłanie plików', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('etykieta i przycisk wyboru pliku powinny być widoczne', async ({ page }) => {
    await expect(page.locator('[data-testid="file-upload-label"]')).toBeVisible();
    await expect(page.locator('[data-testid="file-upload-button"]')).toHaveText('Wybierz plik');
  });

  test('przycisk "Usuń plik" powinien być wyłączony na początku', async ({ page }) => {
    await expect(page.locator('[data-testid="removeFileButton"]')).toBeDisabled();
  });

  test('powinien pokazać szczegóły pliku po wybraniu pliku tekstowego', async ({ page }) => {
    const fileInput = page.locator('[data-testid="documentFile"]');
    await fileInput.setInputFiles({
      name: 'test.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Treść pisma urzędowego'),
    });

    await expect(page.locator('[data-testid="removeFileButton"]')).toBeEnabled();
    await expect(page.locator('[data-testid="fileDetails"]')).toBeVisible();
    await expect(page.locator('[data-testid="fileDetails"]')).toContainText('test.txt');
  });

  test('powinien wczytać tekst z pliku txt do textarea', async ({ page }) => {
    const fileInput = page.locator('[data-testid="documentFile"]');
    await fileInput.setInputFiles({
      name: 'pismo.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Szanowny Panie, niniejszym informujemy...'),
    });

    await page.waitForTimeout(300);
    const textarea = page.locator('[data-testid="documentText"]');
    await expect(textarea).toHaveValue('Szanowny Panie, niniejszym informujemy...');
  });

  test('przycisk "Usuń plik" powinien czyścić wybrany plik', async ({ page }) => {
    const fileInput = page.locator('[data-testid="documentFile"]');
    await fileInput.setInputFiles({
      name: 'test.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Test'),
    });

    await expect(page.locator('[data-testid="removeFileButton"]')).toBeEnabled();
    await expect(page.locator('[data-testid="fileDetails"]')).toBeVisible();

    await page.locator('[data-testid="removeFileButton"]').click();
    await expect(page.locator('[data-testid="removeFileButton"]')).toBeDisabled();
    await expect(page.locator('[data-testid="fileDetails"]')).not.toBeVisible();
  });

  test('powinien pokazać błąd dla nieobsługiwanego formatu pliku', async ({ page }) => {
    const fileInput = page.locator('[data-testid="documentFile"]');
    await fileInput.setInputFiles({
      name: 'test.exe',
      mimeType: 'application/octet-stream',
      buffer: Buffer.from('test'),
    });

    await expect(page.locator('[data-testid="errorMessage"]')).toBeVisible();
    await expect(page.locator('[data-testid="errorMessage"]')).toContainText('Nieobsługiwany format');
  });

  test('powinien pokazać błąd dla pliku za dużego (powyżej 5 MB)', async ({ page }) => {
    const fileInput = page.locator('[data-testid="documentFile"]');
    const bigBuffer = Buffer.alloc(6 * 1024 * 1024, 'x');
    await fileInput.setInputFiles({
      name: 'large.pdf',
      mimeType: 'application/pdf',
      buffer: bigBuffer,
    });

    await expect(page.locator('[data-testid="errorMessage"]')).toBeVisible();
    await expect(page.locator('[data-testid="errorMessage"]')).toContainText('za duży');
  });

  test('powinien umożliwić ponowny wybór pliku po usunięciu', async ({ page }) => {
    const fileInput = page.locator('[data-testid="documentFile"]');
    await fileInput.setInputFiles({
      name: 'test.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Pierwszy plik'),
    });

    await page.locator('[data-testid="removeFileButton"]').click();

    await fileInput.setInputFiles({
      name: 'drugi.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Drugi plik'),
    });

    await page.waitForTimeout(300);
    await expect(page.locator('[data-testid="fileDetails"]')).toContainText('drugi.txt');
  });
});
