import { writeFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';

const d = join(process.cwd(), 'img', 'products');

const products = [
  ['poster',                         '#1D4ED8','#312E81', '\uD83C\uDFA8', 'Plakaty A3'],
  ['poster-a4',                      '#1D4ED8','#1E40AF', '\uD83D\uDCC4', 'Plakaty A4'],
  ['newsletter',                     '#7C3AED','#4C1D95', '\uD83D\uDCF0', 'Szablony PDF'],
  ['newsletter-classic',             '#7C3AED','#5B21B6', '\uD83D\uDCCB', 'Szablon Klasyczny'],
  ['boze-narodzenie-zestaw',         '#14532D','#7F1D1D', '\uD83C\uDF81', 'Zestaw Swiateczny'],
  ['boze-narodzenie-plakaty',        '#14532D','#7F1D1D', '\uD83C\uDF84', 'Plakaty PDF'],
  ['zima-plakaty',                   '#0EA5E9','#1E3A5F', '\u2744\uFE0F', 'Plakaty PDF'],
  ['zima-szablony',                  '#0EA5E9','#0369A1', '\u26C4', 'Szablony PDF'],
  ['walentynki-plakaty',             '#BE123C','#7F1D1D', '\u2764\uFE0F', 'Plakaty PDF'],
  ['walentynki-szablony',            '#BE123C','#881337', '\uD83D\uDC8C', 'Szablony PDF'],
  ['dzien-kobiet-plakaty',           '#DB2777','#701A75', '\uD83C\uDF38', 'Plakaty PDF'],
  ['dzien-kobiet-szablony',          '#DB2777','#9D174D', '\uD83D\uDC90', 'Szablony PDF'],
  ['dzien-ziemi-plakaty',            '#15803D','#0F4C81', '\uD83C\uDF0D', 'Plakaty PDF'],
  ['dzien-ziemi-szablony',           '#15803D','#166534', '\uD83C\uDF31', 'Szablony PDF'],
  ['wielkanoc-plakaty',              '#A16207','#166534', '\uD83D\uDC23', 'Plakaty PDF'],
  ['wielkanoc-szablony',             '#A16207','#92400E', '\uD83E\uDD5A', 'Szablony PDF'],
  ['pierwszy-dzien-wiosny-plakaty',  '#16A34A','#3F6212', '\uD83C\uDF37', 'Plakaty PDF'],
  ['pierwszy-dzien-wiosny-szablony', '#16A34A','#065F46', '\uD83C\uDFBC', 'Szablony PDF'],
  ['wiosna-plakaty',                 '#15803D','#3F6212', '\uD83E\uDD8B', 'Plakaty PDF'],
  ['wiosna-szablony',                '#15803D','#065F46', '\uD83C\uDF3B', 'Szablony PDF'],
  ['dzien-matki-plakaty',            '#BE185D','#9D174D', '\uD83D\uDC90', 'Plakaty PDF'],
  ['dzien-matki-szablony',           '#BE185D','#831843', '\uD83D\uDC9D', 'Szablony PDF'],
  ['konstytucja-plakaty',            '#DC2626','#7F1D1D', '\uD83C\uDFDB\uFE0F', 'Plakaty PDF'],
  ['konstytucja-szablony',           '#DC2626','#991B1B', '\u2696\uFE0F', 'Szablony PDF'],
  ['dzien-dziecka-plakaty',          '#D97706','#C2410C', '\uD83C\uDF88', 'Plakaty PDF'],
  ['dzien-dziecka-szablony',         '#D97706','#B45309', '\uD83C\uDF89', 'Szablony PDF'],
  ['dzien-ojca-plakaty',             '#1E3A5F','#374151', '\uD83D\uDC54', 'Plakaty PDF'],
  ['dzien-ojca-szablony',            '#1E3A5F','#1F2937', '\uD83C\uDFA9', 'Szablony PDF'],
  ['lato-plakaty',                   '#D97706','#B45309', '\u2600\uFE0F', 'Plakaty PDF'],
  ['lato-szablony',                  '#D97706','#92400E', '\uD83C\uDFC4', 'Szablony PDF'],
  ['zakonczenie-roku-plakaty',       '#92400E','#78350F', '\uD83C\uDF93', 'Plakaty PDF'],
  ['zakonczenie-roku-szablony',      '#92400E','#451A03', '\uD83C\uDFC6', 'Szablony PDF'],
  ['poczatek-roku-plakaty',          '#1D4ED8','#065F46', '\uD83C\uDF92', 'Plakaty PDF'],
  ['poczatek-roku-szablony',         '#1D4ED8','#1E3A5F', '\u270F\uFE0F', 'Szablony PDF'],
  ['jesien-plakaty',                 '#C2410C','#78350F', '\uD83C\uDF42', 'Plakaty PDF'],
  ['jesien-szablony',                '#C2410C','#92400E', '\uD83C\uDF41', 'Szablony PDF'],
  ['dzien-nauczyciela-plakaty',      '#0369A1','#1E3A5F', '\uD83D\uDCDA', 'Plakaty PDF'],
  ['dzien-nauczyciela-szablony',     '#0369A1','#075985', '\uD83C\uDF4E', 'Szablony PDF'],
  ['halloween-plakaty',              '#C2410C','#1C1917', '\uD83C\uDF83', 'Plakaty PDF'],
  ['halloween-szablony',             '#C2410C','#292524', '\uD83D\uDC7B', 'Szablony PDF'],
  ['andrzejki-plakaty',              '#6D28D9','#2E1065', '\u2B50', 'Plakaty PDF'],
  ['andrzejki-szablony',             '#6D28D9','#4C1D95', '\uD83D\uDD2E', 'Szablony PDF'],
  ['mikolajki-plakaty',              '#DC2626','#7C2D12', '\uD83C\uDF85', 'Plakaty PDF'],
  ['mikolajki-szablony',             '#DC2626','#991B1B', '\uD83C\uDF81', 'Szablony PDF'],
  ['dzien-babci-plakaty',            '#DB2777','#BE185D', '\uD83C\uDF39', 'Plakaty PDF'],
  ['dzien-babci-szablony',           '#DB2777','#9D174D', '\uD83D\uDC96', 'Szablony PDF'],
  ['niepodleglosc-plakaty',          '#DC2626','#1C1917', '\uD83E\uDD85', 'Plakaty PDF'],
  ['niepodleglosc-szablony',         '#DC2626','#292524', '\uD83C\uDFDB\uFE0F', 'Szablony PDF'],
];

for (const [name, c1, c2, emoji, label] of products) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 260">
  <defs>
    <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
  </defs>
  <rect width="400" height="260" fill="url(#g)"/>
  <circle cx="50" cy="50" r="80" fill="#fff" fill-opacity=".07"/>
  <circle cx="370" cy="220" r="100" fill="#fff" fill-opacity=".05"/>
  <text x="200" y="105" font-size="80" text-anchor="middle" dominant-baseline="middle" font-family="Segoe UI Emoji,Apple Color Emoji,Noto Color Emoji,sans-serif">${emoji}</text>
  <rect x="0" y="190" width="400" height="70" fill="#000" fill-opacity=".25"/>
  <text x="200" y="230" font-size="20" font-weight="bold" text-anchor="middle" dominant-baseline="middle" fill="#fff" font-family="Arial,sans-serif">${label}</text>
</svg>`;
  writeFileSync(join(d, `prod-${name}.svg`), svg, 'utf8');
}

console.log(`Generated ${products.length} SVGs`);
