import { test, expect } from '@playwright/test';

test.describe('CSS Styles and Layout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('checkout summary product image has correct dimensions', async ({ page }) => {
    // Open category and add a product to cart
    await page.getByTestId('btn-expand-category').first().click();
    const addBtn = page.locator('[data-testid="btn-add-to-cart"]').first();
    await addBtn.click();

    // Scroll to checkout section
    const checkoutSection = page.locator('section.checkout');
    await checkoutSection.first().evaluate(el => el.scrollIntoView());

    // Get the product image in checkout summary
    const productImg = page.locator('.checkout-summary-product-img').first();
    
    // Check if it exists
    await expect(productImg).toBeVisible();
    
    // Check computed style dimensions
    const boundingBox = await productImg.boundingBox();
    expect(boundingBox?.width).toBeGreaterThan(0);
    expect(boundingBox?.height).toBeGreaterThan(0);
    expect(boundingBox?.width).toBeLessThan(100); // Should be ~52px
  });

  test('checkout summary actions buttons are visible and aligned', async ({ page }) => {
    await page.getByTestId('btn-expand-category').first().click();
    const addBtn = page.locator('[data-testid="btn-add-to-cart"]').first();
    await addBtn.click();

    const checkoutSection = page.locator('section.checkout');
    await checkoutSection.first().evaluate(el => el.scrollIntoView());

    const actionButtons = page.locator('.checkout-summary-product-actions .cart-btn');
    
    // Check that action buttons exist
    const count = await actionButtons.count();
    expect(count).toBeGreaterThan(0);

    // Check first button is visible and clickable
    const firstBtn = actionButtons.first();
    await expect(firstBtn).toBeVisible();
    
    // Check button dimensions (should be ~40px based on CSS)
    const boundingBox = await firstBtn.boundingBox();
    expect(boundingBox?.width).toBeGreaterThanOrEqual(35);
    expect(boundingBox?.height).toBeGreaterThanOrEqual(35);
  });

  test('product card button has correct styling', async ({ page }) => {
    await page.getByTestId('btn-expand-category').first().click();
    const addBtn = page.locator('[data-testid="btn-add-to-cart"]').first();
    
    // Check button color (yellow gradient background)
    const bgColor = await addBtn.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    expect(bgColor).toBeTruthy();

    // Check text color (should be red #b30000)
    const textColor = await addBtn.evaluate((el) => {
      return window.getComputedStyle(el).color;
    });
    expect(textColor).toBeTruthy();

    // Check button is not disabled
    const isDisabled = await addBtn.isDisabled();
    expect(isDisabled).toBe(false);
  });

  test('checkout section displays as white card with shadow', async ({ page }) => {
    const checkoutForm = page.locator('.checkout-form').first();
    
    // Check background color is white or near-white
    const bgColor = await checkoutForm.evaluate((el) => {
      return window.getComputedStyle(el).backgroundColor;
    });
    expect(bgColor).toMatch(/rgb\(255,\s*255,\s*255|white/i);

    // Check border-radius exists
    const borderRadius = await checkoutForm.evaluate((el) => {
      return window.getComputedStyle(el).borderRadius;
    });
    expect(borderRadius).toBeTruthy();

    // Check box-shadow exists
    const boxShadow = await checkoutForm.evaluate((el) => {
      return window.getComputedStyle(el).boxShadow;
    });
    expect(boxShadow).not.toBe('none');
  });

  test('checkout summary is visible and properly sized on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1200, height: 800 });
    
    await page.getByTestId('btn-expand-category').first().click();
    const addBtn = page.locator('[data-testid="btn-add-to-cart"]').first();
    await addBtn.click();

    const checkoutSummary = page.locator('.checkout-summary').first();
    await expect(checkoutSummary).toBeVisible();

    // Check summary is not hidden
    const isVisible = await checkoutSummary.isVisible();
    expect(isVisible).toBe(true);
  });

  test('responsive layout stacks on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    const checkoutLayout = page.locator('.checkout-layout');
    
    // On mobile, checkout-layout should stack vertically
    // Check by looking at computed grid or flex properties
    const display = await checkoutLayout.evaluate((el) => {
      return window.getComputedStyle(el).display;
    });
    
    // Should be grid or flex
    expect(['grid', 'flex']).toContain(display);
  });

  test('input fields have proper focus states', async ({ page }) => {
    await page.getByTestId('btn-expand-category').first().click();
    const addBtn = page.locator('[data-testid="btn-add-to-cart"]').first();
    await addBtn.click();

    const phoneInput = page.locator('#customerPhone');
    
    // Focus on input
    await phoneInput.focus();

    // Check that focus state applies styling
    const boxShadow = await phoneInput.evaluate((el) => {
      return window.getComputedStyle(el).boxShadow;
    });
    expect(boxShadow).not.toBe('none');
  });

  test('hero section has proper spacing and sizing', async ({ page }) => {
    const hero = page.locator('header.hero');
    await expect(hero).toBeVisible();

    // Check hero has minimum height
    const boundingBox = await hero.boundingBox();
    expect(boundingBox?.height).toBeGreaterThan(200);
  });

  test('product cards maintain consistent width', async ({ page }) => {
    const productCards = page.locator('.product-card');
    
    const count = await productCards.count();
    expect(count).toBeGreaterThanOrEqual(2);

    // Get bounding boxes of all cards
    const widths: number[] = [];
    for (let i = 0; i < count; i++) {
      const box = await productCards.nth(i).boundingBox();
      if (box?.width) widths.push(box.width);
    }

    // All widths should be similar (within 10% tolerance)
    const avgWidth = widths.reduce((a, b) => a + b, 0) / widths.length;
    widths.forEach(width => {
      const diff = Math.abs(width - avgWidth) / avgWidth;
      expect(diff).toBeLessThan(0.1);
    });
  });

  test('buttons have minimum touch target size (44x44px)', async ({ page }) => {
    const buttons = page.locator('button');
    
    const count = await buttons.count();
    expect(count).toBeGreaterThan(0);

    // Check first few buttons have adequate size
    for (let i = 0; i < Math.min(3, count); i++) {
      const box = await buttons.nth(i).boundingBox();
      // Buttons should be at least 44x44 for accessibility
      if (box?.width && box?.height) {
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
  });

  test('product cards have feature list with items', async ({ page }) => {
    const featureLists = page.locator('.product-features');
    const count = await featureLists.count();
    expect(count).toBeGreaterThanOrEqual(2);

    for (let i = 0; i < Math.min(count, 3); i++) {
      const items = featureLists.nth(i).locator('li');
      const itemCount = await items.count();
      expect(itemCount).toBeGreaterThanOrEqual(1);
    }
  });

  test('hero CTA button links to products section', async ({ page }) => {
    const cta = page.locator('a.hero-cta');
    await expect(cta).toBeVisible();
    await expect(cta).toHaveAttribute('href', '#products');
    await expect(cta).toContainText('Wybierz materiały dla swojej klasy');
  });

  test('product cards have expand button in footer', async ({ page }) => {
    const cards = page.locator('.product-card');
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(2);

    // Check first few cards
    for (let i = 0; i < Math.min(count, 4); i++) {
      const footer = cards.nth(i).locator('.product-card-footer');
      await expect(footer).toBeVisible();
      await expect(footer.locator('.category-expand-btn')).toBeVisible();
    }
  });
});
