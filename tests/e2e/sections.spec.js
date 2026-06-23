const { test, expect } = require('@playwright/test');

test.describe('header-hero', () => {
  test('has correct structure and content', async ({ page }) => {
    await page.goto(`file://${process.cwd()}/index.html`);

    const section = page.locator('[data-testid="header-hero"]');
    await expect(section).toBeVisible();
    await expect(section).toHaveId('header');

    await expect(page.locator('[data-testid="hero-section-tag"]')).toHaveText('Jasne pismo');
    await expect(page.locator('[data-testid="hero-heading"]')).toContainText('Masz pismo?');
    await expect(page.locator('[data-testid="hero-subtitle"]')).toBeVisible();

    const bgSvg = page.locator('[data-testid="hero-bg-svg"]');
    await expect(bgSvg).toBeVisible();
    await expect(bgSvg).toHaveAttribute('aria-hidden', 'true');
  });
});

test.describe('section-app', () => {
  test('has correct structure and content', async ({ page }) => {
    await page.goto(`file://${process.cwd()}/index.html`);

    const section = page.locator('[data-testid="section-app"]');
    await expect(section).toBeVisible();
    await expect(section).toHaveId('app-section');

    await expect(page.locator('[data-testid="section-app-tag"]')).toHaveText('Jak to działa');
    await expect(page.locator('[data-testid="section-app-heading"]')).toBeVisible();
    await expect(page.locator('[data-testid="section-app-intro"]')).toBeVisible();

    await expect(page.locator('[data-testid="form-explain"]')).toBeVisible();
    await expect(page.locator('[data-testid="documentText"]')).toBeVisible();
    await expect(page.locator('[data-testid="textCount"]')).toBeVisible();
    await expect(page.locator('[data-testid="file-upload-label"]')).toBeVisible();
    await expect(page.locator('[data-testid="documentFile"]')).toBeHidden();
    await expect(page.locator('[data-testid="file-upload-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="removeFileButton"]')).toBeDisabled();
    await expect(page.locator('[data-testid="fileDetails"]')).toBeHidden();
    await expect(page.locator('[data-testid="freeButton"]')).toBeVisible();
    await expect(page.locator('[data-testid="clearButton"]')).toBeVisible();
    await expect(page.locator('[data-testid="statusMessage"]')).toBeHidden();
    await expect(page.locator('[data-testid="errorMessage"]')).toBeHidden();
    await expect(page.locator('[data-testid="confirmModal"]')).toBeHidden();
    await expect(page.locator('[data-testid="resultCard"]')).toBeHidden();
  });

  test('modal appears and can be dismissed', async ({ page }) => {
    await page.goto(`file://${process.cwd()}/index.html`);
    await page.locator('[data-testid="clearButton"]').click();
    await expect(page.locator('[data-testid="confirmModal"]')).toBeVisible();
    await expect(page.locator('[data-testid="confirmModalTitle"]')).toContainText('Wyczyścić tekst?');
    await expect(page.locator('[data-testid="confirmModalText"]')).toBeVisible();
    await page.locator('[data-testid="cancelClearButton"]').click();
    await expect(page.locator('[data-testid="confirmModal"]')).toBeHidden();
  });
});

test.describe('section-nav', () => {
  test('has correct structure and content', async ({ page }) => {
    await page.goto(`file://${process.cwd()}/index.html`);

    const section = page.locator('[data-testid="section-nav"]');
    await expect(section).toBeVisible();
    await expect(section).toHaveId('sections-nav');

    await expect(page.locator('[data-testid="section-nav-tag"]')).toHaveText('Nawigacja');
    await expect(page.locator('[data-testid="section-nav-heading"]')).toHaveText('Przejdź do sekcji');

    await expect(page.locator('[data-testid="link-app"]')).toContainText('Jak to działa');
    await expect(page.locator('[data-testid="link-info"]')).toContainText('Bezpieczeństwo');
    await expect(page.locator('[data-testid="link-about"]')).toContainText('O nas');
    await expect(page.locator('[data-testid="link-privacy"]')).toContainText('Polityka prywatności');
    await expect(page.locator('[data-testid="link-terms"]')).toContainText('Regulamin');
    await expect(page.locator('[data-testid="link-contact"]')).toContainText('Kontakt');
  });

  test('all nav links point to valid section ids', async ({ page }) => {
    await page.goto(`file://${process.cwd()}/index.html`);
    const links = await page.locator('[data-testid^="link-"]').all();
    for (const link of links) {
      const href = await link.getAttribute('href');
      expect(href).toMatch(/^#.+/);
      const targetId = href.substring(1);
      await expect(page.locator(`#${targetId}`)).toHaveCount(1);
    }
  });
});

test.describe('section-info', () => {
  test('has correct structure and content', async ({ page }) => {
    await page.goto(`file://${process.cwd()}/index.html`);

    const section = page.locator('[data-testid="section-info"]');
    await expect(section).toBeVisible();
    await expect(section).toHaveId('info-section');

    await expect(page.locator('[data-testid="section-info-tag"]')).toHaveText('Bezpieczeństwo');
    await expect(page.locator('[data-testid="info-heading"]')).toContainText('nie jest przechowywane');
    await expect(page.locator('[data-testid="section-info-intro"]')).toBeVisible();
  });
});

test.describe('section-about', () => {
  test('has correct structure and content', async ({ page }) => {
    await page.goto(`file://${process.cwd()}/index.html`);

    const section = page.locator('[data-testid="section-about"]');
    await expect(section).toBeVisible();
    await expect(section).toHaveId('about-section');

    await expect(page.locator('[data-testid="section-about-tag"]')).toHaveText('O nas');
    await expect(page.locator('[data-testid="section-about-heading"]')).toContainText('Dlaczego');
    await expect(page.locator('[data-testid="link-about-cta"]')).toBeVisible();
  });
});

test.describe('section-privacy', () => {
  test('has correct structure and content', async ({ page }) => {
    await page.goto(`file://${process.cwd()}/index.html`);

    const section = page.locator('[data-testid="section-privacy"]');
    await expect(section).toBeVisible();
    await expect(section).toHaveId('privacy-section');

    await expect(page.locator('[data-testid="section-privacy-tag"]')).toHaveText('Polityka prywatności');
    await expect(page.locator('[data-testid="section-privacy-heading"]')).toContainText('Jak przetwarzamy');
  });
});

test.describe('section-terms', () => {
  test('has correct structure and content', async ({ page }) => {
    await page.goto(`file://${process.cwd()}/index.html`);

    const section = page.locator('[data-testid="section-terms"]');
    await expect(section).toBeVisible();
    await expect(section).toHaveId('terms-section');

    await expect(page.locator('[data-testid="section-terms-tag"]')).toHaveText('Regulamin');
    await expect(page.locator('[data-testid="section-terms-heading"]')).toContainText('Zasady korzystania');

    await expect(section.locator('.summary')).toBeVisible();
    await expect(section.locator('.summary h3')).toHaveText('W skrócie');

    await expect(section.locator('h3:has-text("1. O serwisie")')).toBeVisible();
    await expect(section.locator('h3:has-text("8. Własność intelektualna")')).toBeVisible();
  });
});

test.describe('section-contact', () => {
  test('has correct structure and content', async ({ page }) => {
    await page.goto(`file://${process.cwd()}/index.html`);

    const section = page.locator('[data-testid="section-contact"]');
    await expect(section).toBeVisible();
    await expect(section).toHaveId('contact-section');

    await expect(page.locator('[data-testid="section-contact-tag"]')).toHaveText('Kontakt');
    await expect(page.locator('[data-testid="section-contact-heading"]')).toContainText('Skontaktuj się');
  });
});

test.describe('site-footer', () => {
  test('has correct structure and content', async ({ page }) => {
    await page.goto(`file://${process.cwd()}/index.html`);

    const footer = page.locator('[data-testid="site-footer"]');
    await expect(footer).toBeVisible();
    await expect(footer).toHaveId('footer');

    await expect(page.locator('[data-testid="footer-text"]')).toContainText('Jasne pismo');
  });
});

test.describe('skip-link', () => {
  test('skip link navigates to app-section', async ({ page }) => {
    await page.goto(`file://${process.cwd()}/index.html`);

    const skipLink = page.locator('.skip-link');
    await expect(skipLink).toBeVisible();
    await expect(skipLink).toHaveAttribute('href', '#app-section');
  });
});

test.describe('page-level checks', () => {
  test('all sections have correct ids', async ({ page }) => {
    await page.goto(`file://${process.cwd()}/index.html`);

    const expectedIds = [
      'header', 'app-section', 'sections-nav', 'info-section',
      'about-section', 'privacy-section', 'terms-section',
      'contact-section', 'footer',
    ];
    for (const id of expectedIds) {
      await expect(page.locator(`#${id}`)).toHaveCount(1);
    }
  });

  test('all sections have unique data-testid attributes', async ({ page }) => {
    await page.goto(`file://${process.cwd()}/index.html`);
    const testids = await page.locator('[data-testid]').all();
    const values = [];
    for (const el of testids) {
      values.push(await el.getAttribute('data-testid'));
    }
    const unique = new Set(values);
    expect(unique.size).toBe(values.length);
  });

  test('page has correct language attribute', async ({ page }) => {
    await page.goto(`file://${process.cwd()}/index.html`);
    await expect(page.locator('html')).toHaveAttribute('lang', 'pl');
  });

  test('page has correct viewport meta', async ({ page }) => {
    await page.goto(`file://${process.cwd()}/index.html`);
    const meta = page.locator('meta[name="viewport"]');
    await expect(meta).toHaveAttribute('content', 'width=device-width, initial-scale=1.0');
  });
});
