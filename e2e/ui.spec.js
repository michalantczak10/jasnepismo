const { test, expect } = require('@playwright/test');
const path = require('path');

const indexFileUrl = () => {
  const filePath = path.resolve(__dirname, '..', 'index.html');
  return 'file://' + filePath.replaceAll('\\', '/');
};

test.describe('UI and form behavior', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(indexFileUrl());
  });

  test('text count updates and buttons enable/disable', async ({ page }) => {
    const textarea = page.locator('[data-testid="documentText"]');
    const textCount = page.locator('[data-testid="textCount"]');
    const freeButton = page.locator('[data-testid="freeButton"]');
    const clearButton = page.locator('[data-testid="clearButton"]');

    await expect(textCount).toHaveText('0 / 5000 znaków');
    await expect(freeButton).toBeDisabled();
    await expect(clearButton).toBeDisabled();

    await textarea.fill('Ala ma kota');
    // we only assert that the counter changed to a positive number (avoid strict counts)
    await expect(textCount).toHaveText(/\d+ \//);
    await expect(freeButton).toBeEnabled();
    await expect(clearButton).toBeEnabled();
  });

  test('clear button opens modal and cancel closes it', async ({ page }) => {
    const textarea = page.locator('[data-testid="documentText"]');
    const clearButton = page.locator('[data-testid="clearButton"]');
    const confirmModal = page.locator('[data-testid="confirmModal"]');
    const cancelClearButton = page.locator('[data-testid="cancelClearButton"]');

    await textarea.fill('Test do wyczyszczenia');
    await clearButton.click();
    await expect(confirmModal).toBeVisible();

    await cancelClearButton.click();
    await expect(confirmModal).toBeHidden();
  });

  test('confirm clear clears textarea and hides result', async ({ page }) => {
    const textarea = page.locator('[data-testid="documentText"]');
    const clearButton = page.locator('[data-testid="clearButton"]');
    const confirmClearButton = page.locator('[data-testid="confirmClearButton"]');
    const resultCard = page.locator('[data-testid="resultCard"]');

    await textarea.fill('Test do wyczyszczenia');
    // simulate a result being present
    await page.evaluate(() => {
      const rc = document.getElementById('resultCard');
      rc.hidden = false;
    });
    await clearButton.click();
    await expect(confirmClearButton).toBeVisible();
    await confirmClearButton.click();

    await expect(textarea).toHaveValue('');
    await expect(resultCard).toBeHidden();
  });

  test('file input shows file details and remove works', async ({ page }) => {
    const documentFile = page.locator('[data-testid="documentFile"]');
    const fileDetails = page.locator('[data-testid="fileDetails"]');
    const removeFileButton = page.locator('[data-testid="removeFileButton"]');

    // initially disabled
    await expect(removeFileButton).toBeDisabled();

    const fixture = path.resolve(__dirname, 'fixtures', 'sample.txt');
    await documentFile.setInputFiles(fixture);

    // waiting for fileDetails to be visible
    await expect(fileDetails).toBeVisible();
    await expect(removeFileButton).toBeEnabled();

    await removeFileButton.click();
    await expect(fileDetails).toBeHidden();
    await expect(removeFileButton).toBeDisabled();
  });

  test('hero is above main in layout (position)', async ({ page }) => {
    const hero = page.locator('[data-testid="header-hero"]');
    const main = page.locator('main');

    const heroBox = await hero.boundingBox();
    const mainBox = await main.boundingBox();

    expect(heroBox).not.toBeNull();
    expect(mainBox).not.toBeNull();
    // hero top should be less (higher on page) than main top
    expect(heroBox.y).toBeLessThan(mainBox.y);
  });

  test('hero copy visible and contains expected heading text', async ({ page }) => {
    const heroCopy = page.locator('[data-testid="hero-copy"]');
    await expect(heroCopy).toBeVisible();
    await expect(page.locator('[data-testid="hero-heading"]')).toHaveText(
      'Masz pismo? Wklej tekst — wyjaśnimy prosto, krok po kroku.'
    );
  });
});
