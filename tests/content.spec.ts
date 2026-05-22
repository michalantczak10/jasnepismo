import { test, expect } from '@playwright/test';
import { pathToFileURL } from 'url';
import path from 'path';

const indexUrl = pathToFileURL(path.join(__dirname, '..', 'index.html')).href;

test.describe('Strona główna', () => {
  test('powinna się otworzyć i mieć poprawny tytuł', async ({ page }) => {
    await page.goto(indexUrl);
    await expect(page).toHaveTitle(/Korepetycje matematyka i informatyka Płock/i);
  });

  test('hero ma nagłówek, podtytuł i przyciski kontaktowe', async ({ page }) => {
    await page.goto(indexUrl);

    const heroHeading = page.locator('.hero-copy h1');
    await expect(heroHeading).toBeVisible();
    await expect(heroHeading).toContainText(/Korepetycje z matematyki i informatyki/i);

    const heroSubtitle = page.locator('.hero-subtitle');
    await expect(heroSubtitle).toBeVisible();
    await expect(heroSubtitle).toContainText(/Lekcje dla uczniów klas 4–8/i);

    const phoneButton = page.locator('.hero-actions a.hero-cta').first();
    await expect(phoneButton).toHaveAttribute('href', 'tel:+48794535366');
    await expect(phoneButton).toContainText(/Zadzwoń teraz/i);

    const whatsappButton = page.locator('.hero-actions a.hero-cta-secondary');
    await expect(whatsappButton).toBeVisible();
    await expect(whatsappButton).toHaveAttribute('href', 'https://wa.me/48794535366');
    await expect(whatsappButton).toContainText(/WhatsApp/i);
  });

  test('sekcja Oferta i Kontakt są obecne oraz mają poprawne dane', async ({ page }) => {
    await page.goto(indexUrl);

    const offerSection = page.locator('#oferta');
    await expect(offerSection).toBeVisible();
    await expect(offerSection.locator('#oferta-heading')).toHaveText('Jak wyglądają moje zajęcia');
    await expect(offerSection.locator('.section-tag')).toHaveText('Oferta');
    await expect(offerSection.locator('.product-features > li')).toHaveCount(5);
    await expect(offerSection.locator('.product-features > li >> text=Matematyka klasy 4–8')).toBeVisible();
    await expect(offerSection.locator('.product-features > li >> text=Lekcje stacjonarnie w mieszkaniu na osiedlu Rembielińskiego')).toBeVisible();

    const contactSection = page.locator('#kontakt');
    await expect(contactSection).toBeVisible();
    await expect(contactSection.locator('#kontakt-heading')).toHaveText('Porozmawiajmy o pierwszym spotkaniu');
    await expect(contactSection.locator('.section-tag')).toHaveText('Kontakt');

    await expect(contactSection.locator('.contact-phone')).toHaveText('794 535 366');
    await expect(contactSection.locator('a[href="tel:+48794535366"]')).toHaveCount(1);
    await expect(contactSection.locator('a[href="https://wa.me/48794535366"]')).toHaveCount(1);
    await expect(contactSection.locator('a[href="https://m.me/michalantczak1988"]')).toHaveCount(1);
    await expect(contactSection.locator('a[href="mailto:kontakt@naukazmichalem.pl"]')).toHaveCount(2);
  });

  test('sekcje Dlaczego warto i Cennik zawierają właściwe elementy i ceny', async ({ page }) => {
    await page.goto(indexUrl);

    const benefitsSection = page.locator('#dlaczego');
    await expect(benefitsSection).toBeVisible();
    await expect(benefitsSection.locator('#dlaczego-heading')).toHaveText('Jak pomagam uczniom osiągnąć sukces');
    await expect(benefitsSection.locator('.benefit-card')).toHaveCount(3);
    await expect(benefitsSection.locator('.benefit-card >> text=Indywidualne tempo')).toBeVisible();
    await expect(benefitsSection.locator('.benefit-card >> text=Metody dopasowane do ucznia')).toBeVisible();
    await expect(benefitsSection.locator('.benefit-card >> text=Przygotowanie do sprawdzianów')).toBeVisible();

    const pricingSection = page.locator('#cennik');
    await expect(pricingSection).toBeVisible();
    await expect(pricingSection.locator('#cennik-heading')).toHaveText('Jasne zasady cenowe');
    await expect(pricingSection.locator('.product-features > li')).toHaveCount(4);
    await expect(pricingSection.locator('.product-features > li >> text=50 zł / 45 min')).toBeVisible();
    await expect(pricingSection.locator('.product-features > li >> text=W cenie: materiały, powtórki i przygotowanie do sprawdzianów.')).toBeVisible();
  });

  test('sekcja O mnie zawiera 4 wyróżnienia i kartę informacyjną', async ({ page }) => {
    await page.goto(indexUrl);

    const aboutSection = page.locator('.section--about');
    await expect(aboutSection).toBeVisible();
    await expect(aboutSection.locator('#about-heading')).toHaveText('Kim jestem i jak pomagam uczniom');
    await expect(aboutSection.locator('.section-tag')).toHaveText('O mnie');
    await expect(aboutSection.locator('.about-highlights > li')).toHaveCount(4);
    await expect(aboutSection.locator('.about-highlights > li >> text=Cierpliwe wyjaśnienia')).toBeVisible();
    await expect(aboutSection.locator('.about-highlights > li >> text=Praktyczne wsparcie')).toBeVisible();
    await expect(aboutSection.locator('.about-highlights > li >> text=Pedagogiczne przygotowanie')).toBeVisible();
    await expect(aboutSection.locator('.about-highlights > li >> text=Koncentracja na wynikach')).toBeVisible();

    await expect(aboutSection.locator('.about-card .about-card-label')).toHaveText('Zajęcia w domu');
    await expect(aboutSection.locator('.about-card h3')).toHaveText('Spokojna przestrzeń na osiedlu Rembielińskiego');
  });

  test('wszystkie sekcje mają poprawne tagi i wstępne opisy', async ({ page }) => {
    await page.goto(indexUrl);

    const sections = [
      { selector: '.section--about', tag: 'O mnie', intro: 'Jestem matematykiem i informatykiem, który prowadzi zajęcia z matematyki i informatyki w Płocku.' },
      { selector: '#oferta', tag: 'Oferta', intro: 'Zajęcia dopasowane do poziomu ucznia w Płocku, prowadzone w spokojnym tempie i z praktycznymi wyjaśnieniami. Każda lekcja to konkretne wsparcie w nauce.' },
      { selector: '#dlaczego', tag: 'Dlaczego warto', intro: 'Korepetycje w kameralnej atmosferze, wytłumaczone na spokojnie i dopasowane do poziomu ucznia.' },
      { selector: '#cennik', tag: 'Cennik', intro: '50 zł za 45 minut lekcji indywidualnej w przyjaznej atmosferze w Płocku. Bez ukrytych opłat, z elastycznym dopasowaniem do Twojego planu.' },
      { selector: '#kontakt', tag: 'Kontakt', intro: 'Wybierz wygodny kanał kontaktu: telefon, WhatsApp, Messenger lub e-mail.' }
    ];

    for (const section of sections) {
      const locator = page.locator(section.selector);
      await expect(locator).toBeVisible();
      await expect(locator.locator('.section-tag')).toHaveText(section.tag);
      await expect(locator.locator('.section-intro')).toHaveText(section.intro);
    }
  });

  test('footer jest widoczny i kontakt poprawnie działa na mobilnym widoku', async ({ page }) => {
    await page.setViewportSize({ width: 420, height: 960 });
    await page.goto(indexUrl);

    const footer = page.locator('footer.site-footer');
    await expect(footer).toBeVisible();
    await expect(footer).toContainText('Masz pytanie? Skorzystaj z sekcji Kontakt powyżej.');

    const contactButton = page.locator('.hero-actions a.hero-cta').first();
    await expect(contactButton).toBeVisible();
    await expect(contactButton).toHaveAttribute('href', 'tel:+48794535366');
  });

  test('sekcja Dlaczego warto ma 3 karty i poprawny desktopowy układ', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await page.goto(indexUrl);

    const benefitsSection = page.locator('#dlaczego');
    await expect(benefitsSection).toBeVisible();
    await expect(benefitsSection.locator('#dlaczego-heading')).toHaveText('Jak pomagam uczniom osiągnąć sukces');

    const cards = benefitsSection.locator('.benefit-card');
    await expect(cards).toHaveCount(3);
    await expect(cards.nth(0)).toContainText('Indywidualne tempo');
    await expect(cards.nth(1)).toContainText('Metody dopasowane do ucznia');
    await expect(cards.nth(2)).toContainText('Przygotowanie do sprawdzianów');

    const heroSection = page.locator('.hero');
    const heroBox = await heroSection.boundingBox();
    expect(heroBox).not.toBeNull();
    if (heroBox) {
      expect(heroBox.width).toBeGreaterThan(700);
    }
  });

  test('hero ma gradientowe tło i animowany obrazek', async ({ page }) => {
    await page.goto(indexUrl);

    const hero = page.locator('.hero');
    const heroBg = await hero.evaluate((element) => window.getComputedStyle(element).backgroundImage);
    expect(heroBg).toContain('linear-gradient');
    expect(heroBg).toContain('radial-gradient');

    const heroImage = page.locator('.hero-image');
    await expect(heroImage).toBeVisible();
    const animationName = await heroImage.evaluate((element) => window.getComputedStyle(element).animationName);
    expect(animationName).toContain('heroImageReveal');
  });
});
