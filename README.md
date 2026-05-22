# Naukazmichalem — Wizytówka

Prosta, statyczna wizytówka internetowa prezentująca ofertę korepetycji z matematyki i informatyki.

## Co znajduje się w projekcie

- `index.html` — strona główna
- `styles.css` — styl wizytówki
- `img/` — obrazy używane na stronie
- `favicon.svg`, `favicon.ico`, `favicon-*.png`, `apple-touch-icon.png`, `site.webmanifest`, `robots.txt`, `sitemap.xml` — pliki statyczne serwowane z katalogu głównego
- `tests/` — testy Playwright dla wizualnej i treściowej weryfikacji strony
- `scripts/generate-favicons.js` — generator faviconów z SVG
- `package.json`, `package-lock.json`, `tsconfig.json`, `playwright.config.ts` — konfiguracja projektu i testów
- `.gitignore` — reguły Git

## Jak używać

1. Otwórz `index.html` w przeglądarce.
2. Lub opublikuj cały katalog jako statyczną stronę na dowolnym hostingu.

## Testy Playwright

Aby uruchomić testy lokalnie, zainstaluj zależności i uruchom testy:

```bash
npm install
npm test
```

Dostępne komendy testowe:

- `npm test` — uruchamia wszystkie testy Playwright
- `npm run test:visual` — uruchamia tylko testy wizualne (`tests/visual.spec.ts`)
- `npm run test:content` — uruchamia tylko testy treściowe (`tests/content.spec.ts`)
- `npm run test:report` — uruchamia testy i generuje raport HTML
- `npm run test:headed` — uruchamia testy w trybie widocznym
- `npm run test:ui` — uruchamia interfejs Playwright Test Runner
- `npm run generate:favicons` — generuje favicony PNG/ICO z `favicon.svg`

Dzięki temu możesz łatwo sprawdzić wizualne i treściowe testy strony oraz odświeżyć ikony favicona. 
