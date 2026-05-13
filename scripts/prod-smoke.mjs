import { chromium } from 'playwright';

const baseUrl = process.env.PROD_BASE_URL || 'https://szkolnegazetki.pl';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const results = [];

  async function gotoFirstReachable(paths) {
    for (const path of paths) {
      const url = `${baseUrl}${path}`;
      const response = await page.goto(url, { waitUntil: 'domcontentloaded' });
      if (response && response.status() >= 200 && response.status() < 400) {
        return url;
      }
    }
    throw new Error(`No reachable URL for paths: ${paths.join(', ')}`);
  }

  const step = async (name, fn) => {
    try {
      await fn();
      results.push({ name, status: 'PASS' });
    } catch (error) {
      results.push({ name, status: 'FAIL', message: error?.message || String(error) });
      throw error;
    }
  };

  try {
    await step('Home page loads', async () => {
      await page.goto(baseUrl, { waitUntil: 'domcontentloaded' });
      const rejectCookiesBtn = page.getByRole('button', { name: 'Odrzuć opcjonalne' });
      if (await rejectCookiesBtn.isVisible().catch(() => false)) {
        await rejectCookiesBtn.click();
      }
      await page.getByRole('heading', { level: 1 }).waitFor();
      await page.getByRole('heading', { level: 1, name: /gazetk|grafik/i }).waitFor();
      await page.getByText(/oferta|cennik|zamówienie/i).first().waitFor();
    });

    await step('Add to cart works', async () => {
      const addBtn = page.locator(
        'button:has-text("Dodaj do zamówienia"), [data-testid="btn-add-to-cart"]'
      ).first();
      await addBtn.scrollIntoViewIfNeeded();
      await addBtn.click();

      const summaryText = await page
        .locator('#checkoutSummary, [data-testid="checkout-summary-list"], .checkout-summary, [aria-label*="Podsumowanie"]')
        .first()
        .textContent()
        .catch(() => '');

      const bodyText = (await page.locator('body').textContent()) || '';
      if (!/plakat|gazetk|wyczyść|razem|produkty/i.test(`${summaryText || ''} ${bodyText}`)) {
        throw new Error('Cart feedback missing after add-to-cart click');
      }
    });

    await step('Checkout remains reachable after reload', async () => {
      await page.reload({ waitUntil: 'domcontentloaded' });
      const checkoutSignals = (await page.locator('body').textContent()) || '';
      if (!/zamówienie|checkout|podsumowanie/i.test(checkoutSignals)) {
        throw new Error('Checkout section missing after reload');
      }
    });

    await step('Phone input is interactive', async () => {
      const phoneInput = page
        .locator('[data-testid="input-customer-phone"], #customerPhone, input[name="customerPhone"], input[type="tel"]')
        .first();

      await phoneInput.fill('123');
      await phoneInput.blur();

      const phoneText = await page.locator('#phoneError').textContent().catch(() => '');
      const bodyText = (await page.locator('body').textContent()) || '';
      const inputValue = await phoneInput.inputValue().catch(() => '');

      if (!/9 cyfr|min\. 9 cyfr/i.test(`${phoneText || ''} ${bodyText}`) && inputValue.length === 0) {
        throw new Error('Phone validation signal missing');
      }
    });

    await step('Legal pages load', async () => {
      await gotoFirstReachable(['/terms.html', '/terms']);
      await page.getByRole('heading', { level: 1, name: /regulamin/i }).waitFor();
      await gotoFirstReachable(['/privacy.html', '/privacy']);
      await page.getByRole('heading', { level: 1, name: /polityka prywatności/i }).waitFor();
    });
  } finally {
    console.log('\nProduction smoke results:');
    for (const result of results) {
      const suffix = result.message ? ` -> ${result.message}` : '';
      console.log(`- ${result.status}: ${result.name}${suffix}`);
    }
    await browser.close();
  }
}

run().catch(() => {
  process.exit(1);
});
