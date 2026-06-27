const { test, expect } = require('@playwright/test');

test.describe('Strona główna — struktura', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('powinna mieć poprawny tytuł strony', async ({ page }) => {
    await expect(page).toHaveTitle(/Jasne pismo/);
  });

  test('powinna wyświetlać sekcję hero z nagłówkiem', async ({ page }) => {
    const hero = page.locator('[data-testid="header-hero"]');
    await expect(hero).toBeVisible();

    const heading = hero.locator('[data-testid="hero-heading"]');
    await expect(heading).toBeVisible();
    await expect(heading).toHaveText(/Masz pismo z urzędu/);
  });

  test('powinna wyświetlać sekcję hero z tagiem i podtytułem', async ({ page }) => {
    await expect(page.locator('[data-testid="hero-section-tag"]')).toHaveText('Jasne pismo');
    await expect(page.locator('[data-testid="hero-subtitle"]')).toBeVisible();
  });

  test('powinna wyświetlać sekcję aplikacji z formularzem', async ({ page }) => {
    const appSection = page.locator('[data-testid="section-app"]');
    await expect(appSection).toBeVisible();
    await expect(appSection.locator('[data-testid="section-app-tag"]')).toHaveText('Jak to działa?');
    await expect(appSection.locator('[data-testid="section-app-heading"]')).toHaveText('Wklej pismo — my wyjaśniamy');
    await expect(appSection.locator('[data-testid="section-app-intro"]')).toBeVisible();
    await expect(appSection.locator('[data-testid="form-explain"]')).toBeVisible();
  });

  test('powinna wyświetlać sekcję informacyjną o danych', async ({ page }) => {
    const infoSection = page.locator('[data-testid="section-info"]');
    await expect(infoSection).toBeVisible();
    await expect(infoSection.locator('[data-testid="section-info-tag"]')).toHaveText('Twoje dane');
    await expect(infoSection.locator('[data-testid="info-heading"]')).toHaveText(/Nie przechowujemy/);
    await expect(infoSection.locator('[data-testid="section-info-intro"]')).toBeVisible();
  });

  test('powinna wyświetlać sekcję "O nas"', async ({ page }) => {
    const aboutSection = page.locator('[data-testid="section-about"]');
    await expect(aboutSection).toBeVisible();
    await expect(aboutSection.locator('[data-testid="section-about-tag"]')).toHaveText('O nas');
    await expect(aboutSection.locator('[data-testid="section-about-heading"]')).toHaveText('Kim jesteśmy?');
  });

  test('powinna wyświetlać sekcję polityki prywatności', async ({ page }) => {
    const privacySection = page.locator('[data-testid="section-privacy"]');
    await expect(privacySection).toBeVisible();
    await expect(privacySection.locator('[data-testid="section-privacy-tag"]')).toHaveText('Prywatność');
    await expect(privacySection.locator('[data-testid="section-privacy-heading"]')).toHaveText(/Co robimy z Twoimi danymi/);
  });

  test('powinna wyświetlać sekcję regulaminu', async ({ page }) => {
    const termsSection = page.locator('[data-testid="section-terms"]');
    await expect(termsSection).toBeVisible();
    await expect(termsSection.locator('[data-testid="section-terms-tag"]')).toHaveText('Regulamin');
    await expect(termsSection.locator('[data-testid="section-terms-heading"]')).toHaveText(/Zasady korzystania/);
  });

  test('powinna wyświetlać stopkę z emailem kontaktowym', async ({ page }) => {
    const footer = page.locator('[data-testid="site-footer"]');
    await expect(footer).toBeVisible();
    await expect(footer.locator('[data-testid="footer-text"]')).toContainText('Jasne pismo');
    await expect(footer.locator('a[href="mailto:kontakt@jasnepismo.pl"]')).toBeVisible();
  });

  test('powinna zawierać wszystkie główne sekcje w poprawnej kolejności', async ({ page }) => {
    const sections = await page.locator('main > section').all();
    const sectionIds = await Promise.all(sections.map(s => s.getAttribute('id')));
    expect(sectionIds).toEqual([
      'app-section',
      'info-section',
      'about-section',
      'privacy-section',
      'terms-section',
    ]);
  });
});
