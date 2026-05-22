import { test, expect } from '@playwright/test';
import { pathToFileURL } from 'url';
import path from 'path';

const indexUrl = pathToFileURL(path.join(__dirname, '..', 'index.html')).href;

test.describe('Style and layout checks', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(indexUrl);
  });

  test('hero section has gradient background, white heading and accent button color', async ({ page }) => {
    const hero = page.locator('.hero');
    await expect(hero).toHaveCount(1);

    const heroBackground = await hero.evaluate((element) => window.getComputedStyle(element).backgroundImage);
    expect(heroBackground).toContain('linear-gradient');
    expect(heroBackground).toContain('radial-gradient');

    const heading = page.locator('.hero-copy h1');
    await expect(heading).toHaveText(/Korepetycje matematyka i informatyka w Płocku/i);

    const headingColor = await heading.evaluate((element) => window.getComputedStyle(element).color);
    expect(headingColor).toBe('rgb(255, 255, 255)');

    const heroButton = page.locator('.hero-cta').first();
    const buttonBg = await heroButton.evaluate((element) => window.getComputedStyle(element).backgroundColor);
    expect(buttonBg).toBe('rgb(255, 204, 0)');

    const buttonTransition = await heroButton.evaluate((element) => window.getComputedStyle(element).transition);
    expect(buttonTransition).toContain('transform 0.24s');
    expect(buttonTransition).toContain('background-color 0.24s');
  });

  test('hero subtitle color and button icon interaction styles are correct', async ({ page }) => {
    const heroSubtitle = page.locator('.hero-subtitle');
    const subtitleColor = await heroSubtitle.evaluate((element) => window.getComputedStyle(element).color);
    expect(subtitleColor).toBe('rgba(255, 255, 255, 0.95)');

    const icon = page.locator('.hero-cta .button-icon').first();
    const iconTransform = await icon.evaluate((element) => window.getComputedStyle(element).transform);
    expect(iconTransform).not.toBe('none');

    const buttonSpacing = await page.locator('.hero-actions').evaluate((element) => {
      const children = Array.from(element.querySelectorAll('a.hero-cta'));
      if (children.length < 2) return null;
      const rect0 = children[0].getBoundingClientRect();
      const rect1 = children[1].getBoundingClientRect();
      return rect1.left - rect0.right;
    });
    expect(buttonSpacing).not.toBeNull();
    expect(buttonSpacing!).toBeGreaterThanOrEqual(15);
  });

  test('section headings use underline gradient accent', async ({ page }) => {
    const heading = page.locator('.section h2').first();
    await expect(heading).toHaveText(/Kim jestem i jak pomagam uczniom|Jak wyglądają moje zajęcia|Jak pomagam uczniom osiągnąć sukces|Jasne zasady cenowe|Porozmawiajmy o pierwszym spotkaniu/);

    const afterBg = await heading.evaluate((element) => window.getComputedStyle(element, '::after').backgroundImage);
    expect(afterBg).toContain('linear-gradient');
  });

  test('hero image has reveal animation configured', async ({ page }) => {
    const heroImage = page.locator('.hero-image');
    const animationName = await heroImage.evaluate((element) => window.getComputedStyle(element).animationName);
    expect(animationName).toContain('heroImageReveal');

    const animationDuration = await heroImage.evaluate((element) => window.getComputedStyle(element).animationDuration);
    expect(animationDuration).toBe('0.9s');

    const opacity = await heroImage.evaluate((element) => window.getComputedStyle(element).opacity);
    expect(opacity).toBe('0');
  });

  test('sections with fade-in class use fadeIn animation', async ({ page }) => {
    const aboutSection = page.locator('.section--about');
    await expect(aboutSection).toHaveClass(/fade-in/);
    const aboutAnimation = await aboutSection.evaluate((element) => window.getComputedStyle(element).animationName);
    expect(aboutAnimation).toContain('fadeIn');

    const contactSection = page.locator('.contact-section');
    const contactBackground = await contactSection.evaluate((element) => window.getComputedStyle(element).backgroundImage);
    expect(contactBackground).toContain('linear-gradient');
  });

  test('hero copy appears above about section and layout is reasonably wide', async ({ page }) => {
    const heroBoundingBox = await page.locator('.hero').boundingBox();
    const aboutBoundingBox = await page.locator('.section--about').boundingBox();
    expect(heroBoundingBox).not.toBeNull();
    expect(aboutBoundingBox).not.toBeNull();
    expect(heroBoundingBox!.y).toBeLessThan(aboutBoundingBox!.y);
    expect(aboutBoundingBox!.width).toBeGreaterThan(320);
  });

  test('hero buttons are large and spaced for desktop layout', async ({ page }) => {
    const firstButton = page.locator('.hero-actions .hero-cta').first();
    const buttonBox = await firstButton.boundingBox();
    expect(buttonBox).not.toBeNull();
    expect(buttonBox!.width).toBeGreaterThan(200);
    expect(buttonBox!.height).toBeGreaterThan(48);
  });
});
