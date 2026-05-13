import { writeFileSync } from 'fs';
import { join } from 'path';

const d = join(process.cwd(), 'img', 'products');

const products = [
  ['poster',                         '#1D4ED8','#312E81', '🎨', 'Plakaty A3'],
  ['poster-a4',                      '#1D4ED8','#1E40AF', '📄', 'Plakaty A4'],
  ['newsletter',                     '#7C3AED','#4C1D95', '📰', 'Szablony PDF'],
  ['newsletter-classic',             '#7C3AED','#5B21B6', '📋', 'Szablon Klasyczny'],
  ['boze-narodzenie-zestaw',         '#14532D','#7F1D1D', '🎁', 'Zestaw Świąteczny'],
  ['boze-narodzenie-plakaty',        '#14532D','#7F1D1D', '🎄', 'Plakaty PDF'],
  ['zima-plakaty',                   '#0EA5E9','#1E3A5F', '❄️', 'Plakaty PDF'],
  ['zima-szablony',                  '#0EA5E9','#0369A1', '⛄', 'Szablony PDF'],
  ['walentynki-plakaty',             '#BE123C','#7F1D1D', '❤️', 'Plakaty PDF'],
  ['walentynki-szablony',            '#BE123C','#881337', '💌', 'Szablony PDF'],
  ['dzien-kobiet-plakaty',           '#DB2777','#701A75', '🌸', 'Plakaty PDF'],
  ['dzien-kobiet-szablony',          '#DB2777','#9D174D', '💐', 'Szablony PDF'],
  ['dzien-ziemi-plakaty',            '#15803D','#0F4C81', '🌍', 'Plakaty PDF'],
  ['dzien-ziemi-szablony',           '#15803D','#166534', '🌱', 'Szablony PDF'],
  ['wielkanoc-plakaty',              '#A16207','#166534', '🐣', 'Plakaty PDF'],
  ['wielkanoc-szablony',             '#A16207','#92400E', '🥚', 'Szablony PDF'],
  ['pierwszy-dzien-wiosny-plakaty',  '#16A34A','#3F6212', '🌷', 'Plakaty PDF'],
  ['pierwszy-dzien-wiosny-szablony', '#16A34A','#065F46', '🎼', 'Szablony PDF'],
  ['wiosna-plakaty',                 '#15803D','#3F6212', '🦋', 'Plakaty PDF'],
  ['wiosna-szablony',                '#15803D','#065F46', '🌻', 'Szablony PDF'],
  ['dzien-matki-plakaty',            '#BE185D','#9D174D', '💝', 'Plakaty PDF'],
  ['dzien-matki-szablony',           '#BE185D','#831843', '💟', 'Szablony PDF'],
  ['konstytucja-plakaty',            '#DC2626','#7F1D1D', '🏛️', 'Plakaty PDF'],
  ['konstytucja-szablony',           '#DC2626','#991B1B', '⚖️', 'Szablony PDF'],
  ['dzien-dziecka-plakaty',          '#D97706','#C2410C', '🎈', 'Plakaty PDF'],
  ['dzien-dziecka-szablony',         '#D97706','#B45309', '🎉', 'Szablony PDF'],
  ['dzien-ojca-plakaty',             '#1E3A5F','#374151', '👔', 'Plakaty PDF'],
  ['dzien-ojca-szablony',            '#1E3A5F','#1F2937', '🎩', 'Szablony PDF'],
  ['lato-plakaty',                   '#D97706','#B45309', '☀️', 'Plakaty PDF'],
  ['lato-szablony',                  '#D97706','#92400E', '🏄', 'Szablony PDF'],
  ['zakonczenie-roku-plakaty',       '#92400E','#78350F', '🎓', 'Plakaty PDF'],
  ['zakonczenie-roku-szablony',      '#92400E','#451A03', '🏆', 'Szablony PDF'],
  ['poczatek-roku-plakaty',          '#1D4ED8','#065F46', '🎒', 'Plakaty PDF'],
  ['poczatek-roku-szablony',         '#1D4ED8','#1E3A5F', '✏️', 'Szablony PDF'],
  ['jesien-plakaty',                 '#C2410C','#78350F', '🍂', 'Plakaty PDF'],
  ['jesien-szablony',                '#C2410C','#92400E', '🍁', 'Szablony PDF'],
  ['dzien-nauczyciela-plakaty',      '#0369A1','#1E3A5F', '📚', 'Plakaty PDF'],
  ['dzien-nauczyciela-szablony',     '#0369A1','#075985', '🍎', 'Szablony PDF'],
  ['halloween-plakaty',              '#C2410C','#1C1917', '🎃', 'Plakaty PDF'],
  ['halloween-szablony',             '#C2410C','#292524', '👻', 'Szablony PDF'],
  ['andrzejki-plakaty',              '#6D28D9','#2E1065', '⭐', 'Plakaty PDF'],
  ['andrzejki-szablony',             '#6D28D9','#4C1D95', '🔮', 'Szablony PDF'],
  ['mikolajki-plakaty',              '#DC2626','#7C2D12', '🎅', 'Plakaty PDF'],
  ['mikolajki-szablony',             '#DC2626','#991B1B', '🎁', 'Szablony PDF'],
  ['dzien-babci-plakaty',            '#DB2777','#BE185D', '🌹', 'Plakaty PDF'],
  ['dzien-babci-szablony',           '#DB2777','#9D174D', '💖', 'Szablony PDF'],
  ['niepodleglosc-plakaty',          '#DC2626','#1C1917', '🦅', 'Plakaty PDF'],
  ['niepodleglosc-szablony',         '#DC2626','#292524', '🏛️', 'Szablony PDF'],
];

// 3 warianty: różne kierunki gradientu + kolor odznaki wersji
const variants = [
  { n: 1, x1: '0%', y1: '0%', x2: '100%', y2: '100%', badgeColor: '#FCD34D', badgeText: '#1C1917', circleX: 50,  circleY: 50  },
  { n: 2, x1: '100%', y1: '0%', x2: '0%',  y2: '100%', badgeColor: '#34D399', badgeText: '#022c22', circleX: 350, circleY: 50  },
  { n: 3, x1: '0%', y1: '100%', x2: '100%', y2: '0%',  badgeColor: '#818CF8', badgeText: '#1e1b4b', circleX: 200, circleY: 20  },
];

let count = 0;
for (const [name, c1, c2, emoji, label] of products) {
  for (const v of variants) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 260">
  <defs>
    <linearGradient id="g" x1="${v.x1}" y1="${v.y1}" x2="${v.x2}" y2="${v.y2}">
      <stop offset="0%" stop-color="${c1}"/>
      <stop offset="100%" stop-color="${c2}"/>
    </linearGradient>
  </defs>
  <rect width="400" height="260" fill="url(#g)"/>
  <circle cx="${v.circleX}" cy="${v.circleY}" r="80" fill="#fff" fill-opacity=".07"/>
  <circle cx="370" cy="220" r="100" fill="#fff" fill-opacity=".05"/>
  <text x="200" y="105" font-size="78" text-anchor="middle" dominant-baseline="middle" font-family="Segoe UI Emoji,Apple Color Emoji,Noto Color Emoji,sans-serif">${emoji}</text>
  <rect x="0" y="190" width="400" height="70" fill="#000" fill-opacity=".25"/>
  <text x="200" y="230" font-size="18" font-weight="bold" text-anchor="middle" dominant-baseline="middle" fill="#fff" font-family="Arial,sans-serif">${label}</text>
  <rect x="8" y="8" width="64" height="26" rx="6" fill="${v.badgeColor}" fill-opacity=".92"/>
  <text x="40" y="21" font-size="13" font-weight="bold" text-anchor="middle" dominant-baseline="middle" fill="${v.badgeText}" font-family="Arial,sans-serif">W${v.n}</text>
</svg>`;
    writeFileSync(join(d, `prod-${name}-v${v.n}.svg`), svg, 'utf8');
    count++;
  }
}

console.log(`Generated ${count} variant SVGs`);
