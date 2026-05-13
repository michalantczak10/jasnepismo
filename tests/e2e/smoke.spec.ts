import { expect, test } from '@playwright/test';

test.describe('Szkolne gazetki smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    const rejectCookiesBtn = page.getByRole('button', { name: 'Odrzuć opcjonalne' });
    if (await rejectCookiesBtn.isVisible()) {
      await rejectCookiesBtn.click();
    }
  });

  test('home page loads with key sections', async ({ page }) => {
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Gotowe gazetki szkolne PDF');
    await expect(page.getByTestId('section-products')).toBeVisible();
    await expect(page.getByTestId('order-form')).toBeVisible();
  });

  test('can add product to cart summary', async ({ page }) => {
    await page.getByTestId('btn-expand-category').first().click();
    await page.getByTestId('btn-add-to-cart').first().click();
    const summary = page.getByTestId('checkout-summary-list');

    await expect(summary).toBeVisible();
    await expect(summary).toContainText('Wariant 1');
    await expect(summary).toContainText('Wyczyść koszyk');
  });

  test('shows warning when submitting empty cart', async ({ page }) => {
    await page.getByTestId('btn-submit-order').click();

    const toast = page.locator('#toastMessage');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('Podsumowanie nie zawiera wybranego produktu.');
    await expect(page.getByTestId('order-confirm-modal')).toHaveCount(0);
  });

  test('toast appears immediately after add to cart action', async ({ page }) => {
    await page.getByTestId('btn-expand-category').first().click();
    await page.getByTestId('btn-add-to-cart').first().click();

    const toast = page.locator('#toastMessage');
    await expect(toast).toContainText('Dodano 1 szt. produktu', { timeout: 300 });
    await expect(toast).toHaveClass(/toast-show/, { timeout: 300 });
  });

  test('toast message updates immediately for rapid cart actions', async ({ page }) => {
    await page.getByTestId('btn-expand-category').first().click();
    await page.getByTestId('btn-add-to-cart').first().click();
    await page.getByTestId('btn-remove-from-cart').first().click();

    const toast = page.locator('#toastMessage');
    await expect(toast).toContainText('Usunięto produkt', { timeout: 400 });
    await expect(toast).toHaveClass(/toast-show/, { timeout: 400 });
  });

  test('non-sticky toast stays visible for several seconds and then auto-hides', async ({ page }) => {
    test.setTimeout(70000);

    await page.getByTestId('btn-expand-category').first().click();
    await page.getByTestId('btn-add-to-cart').first().click();
    await page.getByTestId('btn-remove-from-cart').first().click();

    const toast = page.locator('#toastMessage');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('Usunięto produkt');
    await expect(toast).toHaveClass(/toast-show/);

    await page.waitForTimeout(15000);
    await expect(toast).toHaveClass(/toast-show/);

    await expect(toast).not.toHaveClass(/toast-show/, { timeout: 23000 });
  });

  test('sticky submit toast remains visible until dismissed', async ({ page }) => {
    await page.getByTestId('btn-submit-order').click();

    const toast = page.locator('#toastMessage');
    await expect(toast).toBeVisible();
    await expect(toast).toContainText('Podsumowanie nie zawiera wybranego produktu.');
    await expect(toast).toHaveClass(/toast-show/);

    await page.waitForTimeout(11000);
    await expect(toast).toHaveClass(/toast-show/);

    await toast.click();
    await expect(toast).not.toHaveClass(/toast-show/);
  });

  test('keeps cart items after page reload', async ({ page }) => {
    await page.getByTestId('btn-expand-category').first().click();
    await page.getByTestId('btn-add-to-cart').first().click();
    await expect(page.getByTestId('checkout-summary-list')).toContainText('Wariant 1');

    await page.reload();
    await expect(page.getByTestId('checkout-summary-list')).toContainText('Wariant 1');
  });

  test('validates phone field', async ({ page }) => {
    const phoneInput = page.getByTestId('input-customer-phone');
    const phoneError = page.locator('#phoneError');

    await phoneInput.fill('123');
    await phoneInput.blur();
    await expect(phoneError).toContainText('Numer telefonu musi mieć min. 9 cyfr.');

    await phoneInput.fill('123456789');
    await phoneInput.blur();
    await expect(phoneError).toHaveText('');
  });

  test('formats phone input and limits to 9 digits', async ({ page }) => {
    const phoneInput = page.getByTestId('input-customer-phone');

    await phoneInput.fill('5a1 2-3x4_56789');
    await expect(phoneInput).toHaveValue('512 345 678');
  });

  test('validates notes restrictions and counter', async ({ page }) => {
    const notesInput = page.getByTestId('input-customer-notes');
    const notesError = page.locator('#notesError');
    const notesCounter = page.getByTestId('msg-notes-counter');

    await notesInput.fill('abcde');
    await expect(notesCounter).toHaveText('5 / 300');

    await notesInput.fill('<test>');
    await notesInput.blur();
    await expect(notesError).toContainText('Uwagi nie mogą zawierać znaków < ani >.');
  });

  test('legal drawer opens and switches documents', async ({ page }) => {
    await page.getByRole('link', { name: 'Regulamin' }).first().click();
    const drawer = page.getByTestId('legal-drawer');

    await expect(drawer).toBeVisible();
    await expect(drawer).toContainText('Informacje ogólne');

    const termsTab = page.getByTestId('tab-legal-terms');
    await expect(termsTab).toHaveClass(/active/);

    await page.getByTestId('tab-legal-privacy').click();
    await expect(drawer).toContainText('Administrator danych');

    await termsTab.click();
    await expect(drawer).toContainText('Informacje ogólne');

    await page.getByTestId('btn-legal-drawer-close').click();
    await expect(drawer).not.toBeVisible();
  });

  test('cookie consent privacy link opens privacy tab in drawer', async ({ page }) => {
    // Reset consent so the banner is visible
    await page.evaluate(() => localStorage.removeItem('cookieConsent_v1'));
    await page.reload();

    const banner = page.getByTestId('cookie-banner');
    await expect(banner).toBeVisible({ timeout: 5000 });

    await banner.getByRole('link', { name: 'Polityka prywatności' }).click();

    const drawer = page.getByTestId('legal-drawer');
    await expect(drawer).toBeVisible();
    await expect(drawer).toContainText('Administrator danych');

    const privacyTab = page.getByTestId('tab-legal-privacy');
    await expect(privacyTab).toHaveClass(/active/);
  });

  test('can add both products to cart', async ({ page }) => {
    await page.getByTestId('btn-expand-category').nth(0).click();
    await page.getByTestId('btn-add-to-cart').first().click();
    await page.getByTestId('btn-expand-category').nth(1).click();
    await page.getByTestId('btn-add-to-cart').first().click();

    const summary = page.getByTestId('checkout-summary-list');
    await expect(summary).toContainText('Wariant 1');
    await expect(summary).toContainText('97 zł');
  });

  test('can remove product from cart', async ({ page }) => {
    await page.getByTestId('btn-expand-category').first().click();
    await page.getByTestId('btn-add-to-cart').first().click();
    const summary = page.getByTestId('checkout-summary-list');
    await expect(summary).toContainText('Wariant 1');

    await page.getByTestId('btn-remove-from-cart').first().click();
    await expect(summary).not.toContainText('Wariant 1');
  });

  test('can clear cart', async ({ page }) => {
    await page.getByTestId('btn-expand-category').first().click();
    await page.getByTestId('btn-add-to-cart').first().click();
    const summary = page.getByTestId('checkout-summary-list');
    await expect(summary).toContainText('Wariant 1');

    await page.getByTestId('btn-clear-cart').click();
    await page.getByRole('button', { name: 'Tak, wyczyść' }).click();
    await expect(summary).not.toContainText('Wariant 1');
  });

  test('validates name field length when provided', async ({ page }) => {
    const nameInput = page.getByTestId('input-customer-name');
    const nameError = page.locator('#nameError');

    // Empty name is allowed
    await nameInput.focus();
    await nameInput.blur();
    await expect(nameError).toHaveText('');

    // Overlong name should show validation error
    await nameInput.fill('A'.repeat(81));
    await nameInput.blur();
    await expect(nameError).not.toHaveText('');

    // Valid name should clear error
    await nameInput.fill('Jan Kowalski');
    await nameInput.blur();
    await expect(nameError).toHaveText('');
  });

  test('validates email field', async ({ page }) => {
    const emailInput = page.getByTestId('input-customer-email');
    const emailError = page.locator('#emailError');

    await emailInput.fill('niepoprawny');
    await emailInput.blur();
    await expect(emailError).not.toHaveText('');

    await emailInput.fill('test@example.com');
    await emailInput.blur();
    await expect(emailError).toHaveText('');
  });

  test('submit with empty email shows validation errors', async ({ page }) => {
    await page.getByTestId('btn-expand-category').first().click();
    await page.getByTestId('btn-add-to-cart').first().click();
    await page.getByTestId('btn-submit-order').click();

    // Email error should appear
    const emailError = page.locator('#emailError');
    await expect(emailError).not.toHaveText('');
  });

  test('empty cart shows browse offer button', async ({ page }) => {
    // Cart is empty on fresh page — browse button should be visible
    const browseBtn = page.getByTestId('btn-browse-offer');
    await expect(browseBtn).toBeVisible();
    await expect(browseBtn).toContainText('Przeglądaj ofertę');
  });

  test('cart quantity buttons change product count', async ({ page }) => {
    await page.getByTestId('btn-expand-category').first().click();
    await page.getByTestId('btn-add-to-cart').first().click();
    const summary = page.getByTestId('checkout-summary-list');

    // Default qty is 1
    await expect(summary.locator('.checkout-summary-product-qty').first()).toHaveText('1');

    // Click increase (+)
    await summary.getByTestId('btn-cart-increase').first().click();
    await expect(summary.locator('.checkout-summary-product-qty').first()).toHaveText('2');

    // Click decrease (-)
    await summary.getByTestId('btn-cart-decrease').first().click();
    await expect(summary.locator('.checkout-summary-product-qty').first()).toHaveText('1');
  });

  test('cart total updates when adding products', async ({ page }) => {
    await page.getByTestId('btn-expand-category').nth(0).click();
    await page.getByTestId('btn-add-to-cart').first().click();
    const summary = page.getByTestId('checkout-summary-list');

    // First product costs 45 zł — total should reflect it
    await expect(summary).toContainText('45 zł');

    // Open second category and add its first product (52 zł)
    await page.getByTestId('btn-expand-category').nth(1).click();
    await page.getByTestId('btn-add-to-cart').first().click();
    await expect(summary).toContainText('97 zł');
  });

  test('hero image is visible and loaded', async ({ page }) => {
    const heroImg = page.locator('.hero-image');
    await expect(heroImg).toBeVisible();

    const naturalWidth = await heroImg.evaluate((img: HTMLImageElement) => img.naturalWidth);
    expect(naturalWidth).toBeGreaterThan(0);
  });

  test('cookie banner appears and can be rejected', async ({ page }) => {
    // Open a fresh page without clearing cookies first
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => localStorage.removeItem('cookieConsent_v1'));
    await page.reload();

    const banner = page.getByTestId('cookie-banner');
    await expect(banner).toBeVisible({ timeout: 5000 });

    await page.getByTestId('btn-cookie-reject').click();
    await expect(banner).not.toBeVisible();
  });

  test('cookie banner can be accepted', async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.evaluate(() => localStorage.removeItem('cookieConsent_v1'));
    await page.reload();

    const banner = page.getByTestId('cookie-banner');
    await expect(banner).toBeVisible({ timeout: 5000 });

    await page.getByTestId('btn-cookie-accept').click();
    await expect(banner).not.toBeVisible();
  });

  test('cookie settings panel opens, can be cancelled and saved', async ({ page }) => {
    await page.evaluate(() => localStorage.removeItem('cookieConsent_v1'));
    await page.reload();

    const banner = page.getByTestId('cookie-banner');
    await expect(banner).toBeVisible({ timeout: 5000 });

    // Open settings panel
    await page.getByTestId('btn-cookie-settings').click();

    // Cancel goes back to banner
    await page.getByTestId('btn-cookie-cancel-settings').click();
    await expect(banner).toBeVisible();

    // Open again and save
    await page.getByTestId('btn-cookie-settings').click();
    await page.getByTestId('btn-cookie-save-settings').click();
    await expect(banner).not.toBeVisible();
  });

  test('cookie manage button reopens settings banner', async ({ page }) => {
    // Accept consent so manage button is visible
    await page.evaluate(() => localStorage.removeItem('cookieConsent_v1'));
    await page.reload();

    const banner = page.getByTestId('cookie-banner');
    await expect(banner).toBeVisible({ timeout: 5000 });
    await page.getByTestId('btn-cookie-accept').click();
    await expect(banner).not.toBeVisible();

    // Manage button should now be present and reopen banner
    await page.getByTestId('btn-cookie-manage').click();
    await expect(banner).toBeVisible();
  });
});
