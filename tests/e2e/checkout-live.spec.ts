import { expect, test } from '@playwright/test';

test.describe('Szkolne gazetki checkout live', () => {
  test.skip(
    process.env.ENABLE_LIVE_E2E !== 'true',
    'Set ENABLE_LIVE_E2E=true to run live checkout tests that create real orders.'
  );

  test.beforeEach(async ({ page }) => {
    await page.goto('/');

    const rejectCookiesBtn = page.getByRole('button', { name: 'Odrzuć opcjonalne' });
    if (await rejectCookiesBtn.isVisible()) {
      await rejectCookiesBtn.click();
    }
  });

  test('submits real order end-to-end without mocks', async ({ page }) => {
    await page.getByTestId('btn-add-to-cart').first().click();
    await page.getByTestId('input-customer-name').fill('E2E Test Szkoła');
    await page.getByTestId('input-customer-email').fill('e2e+live@szkolnegazetki.pl');
    await page.getByTestId('input-customer-phone').fill('512345678');
    await page.getByTestId('input-customer-notes').fill(`E2E real order ${Date.now()}`);

    await page.getByTestId('btn-submit-order').click();

    await expect(page.getByTestId('order-confirm-modal')).toBeVisible({ timeout: 15000 });
    await expect(page.locator('.order-confirm-modal-thankyou')).toContainText('Zamówienie przyjęte!');
    await expect(page.getByTestId('order-confirm-modal')).toContainText('Numer zamówienia:');
    await expect(page.getByTestId('order-confirm-modal')).toContainText('Do zapłaty:');
  });

  test('resets form and cart after closing order confirmation modal', async ({ page }) => {
    await page.getByTestId('btn-add-to-cart').first().click();
    await page.getByTestId('input-customer-name').fill('E2E Test Reset');
    await page.getByTestId('input-customer-email').fill('e2e+reset@szkolnegazetki.pl');
    await page.getByTestId('input-customer-phone').fill('512345678');
    await page.getByTestId('input-customer-notes').fill(`E2E reset check ${Date.now()}`);
    await page.getByTestId('btn-submit-order').click();

    const modal = page.getByTestId('order-confirm-modal');
    await expect(modal).toBeVisible({ timeout: 15000 });
    await modal.getByRole('button', { name: 'OK' }).click();
    await expect(modal).toHaveCount(0);

    await expect(page.getByTestId('input-customer-phone')).toHaveValue('');
    await expect(page.getByTestId('input-customer-notes')).toHaveValue('');
    await expect(page.getByTestId('checkout-summary-list')).toContainText('Koszyk jest pusty.');
  });
});
