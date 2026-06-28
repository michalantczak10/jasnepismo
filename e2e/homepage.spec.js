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

  test('powinna wyświetlać sekcję "Jak to działa?" z krokami', async ({ page }) => {
    const howSection = page.locator('[data-testid="section-how"]');
    await expect(howSection).toBeVisible();
    await expect(howSection.locator('[data-testid="section-how-tag"]')).toHaveText('Jak to działa?');
    await expect(howSection.locator('[data-testid="section-how-heading"]')).toHaveText('W 3 prostych krokach');
    const steps = howSection.locator('.step-card');
    await expect(steps).toHaveCount(3);
  });

  test('powinna wyświetlać sekcję aplikacji z formularzem', async ({ page }) => {
    const appSection = page.locator('[data-testid="section-app"]');
    await expect(appSection).toBeVisible();
    await expect(appSection.locator('[data-testid="section-app-tag"]')).toHaveText('Aplikacja');
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

  test('powinna wyświetlać akordeon polityki prywatności w stopce', async ({ page }) => {
    const privacyAccordion = page.locator('[data-testid="legal-privacy"]');
    await expect(privacyAccordion).toBeVisible();
    await expect(privacyAccordion.locator('summary')).toContainText('Prywatność');
  });

  test('powinna wyświetlać akordeon regulaminu w stopce', async ({ page }) => {
    const termsAccordion = page.locator('[data-testid="legal-terms"]');
    await expect(termsAccordion).toBeVisible();
    await expect(termsAccordion.locator('summary')).toContainText('Regulamin');
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
      'how-it-works',
      'app-section',
      'info-section',
      'about-section',
    ]);
  });
});
