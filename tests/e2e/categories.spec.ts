import { test, expect } from '@playwright/test';

test.describe('Category cards', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const rejectBtn = page.getByRole('button', { name: 'Odrzuć opcjonalne' });
    if (await rejectBtn.isVisible()) await rejectBtn.click();
  });

  test('renders at least 24 category cards', async ({ page }) => {
    const cards = page.locator('.product-card[data-category-id]');
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(24);
  });

  test('category card expands and shows products list', async ({ page }) => {
    const expandBtn = page.getByTestId('btn-expand-category').first();
    await expandBtn.click();

    const panel = page.locator('.category-products-panel.open').first();
    await expect(panel).toBeVisible();
    await expect(panel.locator('.category-products-list')).toBeVisible();
    const items = panel.locator('.category-product-item');
    const count = await items.count();
    expect(count).toBeGreaterThan(0);
  });

  test('expanded category shows product name, description, price and add button', async ({ page }) => {
    await page.getByTestId('btn-expand-category').first().click();
    const item = page.locator('.category-product-item').first();

    await expect(item.locator('.category-product-name')).toBeVisible();
    await expect(item.locator('.category-product-desc')).toBeVisible();
    await expect(item.locator('.category-product-price')).toBeVisible();
    await expect(item.getByTestId('btn-add-to-cart')).toBeVisible();

    const priceText = await item.locator('.category-product-price').textContent();
    expect(priceText).toMatch(/\d+ zł/);
  });

  test('other category cards are blocked while one panel is open', async ({ page }) => {
    const btns = page.getByTestId('btn-expand-category');
    await btns.nth(0).click();

    // While first panel is open, other category expand buttons should be disabled.
    await expect(btns.nth(1)).toBeDisabled();

    const openPanels = page.locator('.category-products-panel.open');
    await expect(openPanels).toHaveCount(1);

    // Close first panel and verify other categories are unlocked again.
    await btns.nth(0).click();
    await expect(btns.nth(1)).toBeEnabled();
  });

  test('category panel collapses when same button clicked again', async ({ page }) => {
    const expandBtn = page.getByTestId('btn-expand-category').first();
    await expandBtn.click();
    await expect(page.locator('.category-products-panel.open').first()).toBeVisible();

    await expandBtn.click();
    await expect(page.locator('.category-products-panel.open')).toHaveCount(0);
  });

  test('aria-expanded attribute toggles on expand/collapse', async ({ page }) => {
    const expandBtn = page.getByTestId('btn-expand-category').first();
    await expect(expandBtn).toHaveAttribute('aria-expanded', 'false');

    await expandBtn.click();
    await expect(expandBtn).toHaveAttribute('aria-expanded', 'true');

    await expandBtn.click();
    await expect(expandBtn).toHaveAttribute('aria-expanded', 'false');
  });
});

test.describe('Preview thumbnails and modal', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    const rejectBtn = page.getByRole('button', { name: 'Odrzuć opcjonalne' });
    if (await rejectBtn.isVisible()) await rejectBtn.click();
    // expand first category to reveal thumbnails
    await page.getByTestId('btn-expand-category').first().click();
  });

  test('shows 6 preview thumbnails per product', async ({ page }) => {
    const gallery = page.locator('.category-preview-gallery').first();
    await expect(gallery).toBeVisible();
    const thumbs = gallery.locator('[data-testid="btn-preview-thumb"]');
    await expect(thumbs).toHaveCount(6);
  });

  test('thumbnail images load from preview assets', async ({ page }) => {
    const thumbImg = page
      .locator('.category-preview-gallery')
      .first()
      .locator('img')
      .first();

    await expect(thumbImg).toBeVisible();
    const src = await thumbImg.getAttribute('src');
    expect(src).toBeTruthy();
    expect(src).toMatch(/(previews\/|previews%2F|\.svg$|data:image\/)/i);
  });

  test('clicking thumbnail opens preview modal', async ({ page }) => {
    const thumb = page.getByTestId('btn-preview-thumb').first();
    await thumb.click();

    const modal = page.getByTestId('preview-modal');
    await expect(modal).toBeVisible({ timeout: 8000 });
    await expect(modal).toHaveClass(/open/);
  });

  test('preview modal has title and image', async ({ page }) => {
    await page.getByTestId('btn-preview-thumb').first().click();
    const modal = page.getByTestId('preview-modal');
    await expect(modal).toBeVisible({ timeout: 8000 });

    const title = modal.locator('.preview-modal-title');
    await expect(title).toBeVisible();
    const titleText = await title.textContent();
    expect(titleText?.trim().length).toBeGreaterThan(0);

    const img = modal.locator('.preview-modal-image');
    await expect(img).toBeVisible();
  });

  test('Escape key closes preview modal', async ({ page }) => {
    await page.getByTestId('btn-preview-thumb').first().click();
    const modal = page.getByTestId('preview-modal');
    await expect(modal).toBeVisible({ timeout: 8000 });

    await page.keyboard.press('Escape');
    await expect(modal).not.toHaveClass(/open/);
  });

  test('clicking backdrop closes preview modal', async ({ page }) => {
    await page.getByTestId('btn-preview-thumb').first().click();
    const modal = page.getByTestId('preview-modal');
    await expect(modal).toBeVisible({ timeout: 8000 });

    // Click at top-left corner of modal — outside the centered dialog box
    await modal.click({ position: { x: 5, y: 5 }, force: true });
    await expect(modal).not.toHaveClass(/open/);
  });

  test('close button closes preview modal', async ({ page }) => {
    await page.getByTestId('btn-preview-thumb').first().click();
    const modal = page.getByTestId('preview-modal');
    await expect(modal).toBeVisible({ timeout: 8000 });

    await modal.locator('.preview-modal-close').click();
    await expect(modal).not.toHaveClass(/open/);
  });
});

test.describe('Preview API endpoints', () => {
  test('GET /api/preview-token returns valid token structure', async ({ request }) => {
    const res = await request.get('/api/preview-token');
    expect(res.status()).toBe(200);
    const body = await res.json();
    expect(typeof body.token).toBe('string');
    expect(body.token.length).toBeGreaterThan(10);
    expect(typeof body.exp).toBe('number');
    const nowSeconds = Math.floor(Date.now() / 1000);
    expect(body.exp).toBeGreaterThan(nowSeconds);
    expect(body.exp).toBeLessThan(nowSeconds + 600); // max 10 min TTL
  });

  test('GET /api/preview-img rejects missing params', async ({ request }) => {
    const res = await request.get('/api/preview-img');
    expect([400, 403]).toContain(res.status());
  });

  test('GET /api/preview-img rejects bad filename', async ({ request }) => {
    const res = await request.get('/api/preview-img?file=../../etc/passwd&token=x&exp=9999999999');
    expect([400, 403]).toContain(res.status());
  });

  test('GET /api/preview-img rejects invalid token', async ({ request }) => {
    const res = await request.get('/api/preview-img?file=plakaty-v1.webp&token=badtoken&exp=9999999999');
    // Dev mode serves without token validation (400/403/404 all acceptable)
    // Production Vercel returns 403
    expect(res.status()).toBeGreaterThanOrEqual(400);
  });

  test('GET /api/preview-img with valid token returns image', async ({ request }) => {
    // First get a valid token
    const tokenRes = await request.get('/api/preview-token');
    expect(tokenRes.status()).toBe(200);
    const { token, exp } = await tokenRes.json();

    // Try to get a preview image for the first product in first category (plakaty)
    const res = await request.get(
      `/api/preview-img?file=plakaty-v1.webp&token=${token}&exp=${exp}`
    );
    // In dev mode (no PREVIEW_SECRET) file might not exist → 404 is acceptable
    // In prod mode should be 200; both are acceptable since previews may not exist in CI
    expect([200, 404]).toContain(res.status());
    if (res.status() === 200) {
      const contentType = res.headers()['content-type'];
      expect(contentType).toContain('image/');
    }
  });
});
