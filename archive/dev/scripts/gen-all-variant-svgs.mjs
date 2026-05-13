/**
 * Generuje 6 miniaturek podglądu (page-preview style) dla każdego z 72 produktów.
 * Pliki: prod-{id}-v1.svg … prod-{id}-v6.svg
 *
 * Warianty produktów (3 per kategoria × 24 kategorie = 72):
 *   wariant1 = ID kończący się na -plakaty / poster / newsletter / -zestaw
 *   wariant2 = ID kończący się na -szablony / poster-a4 / newsletter-classic
 *   wariant3 = ID kończący się na -wariant3
 *
 * 6 miniaturek per produkt mają spójny styl kolorystyczny (jak 6 stron tej samej gazetki),
 * ale różnią się układem i numerem strony.
 */
import { writeFileSync } from 'fs';
import { join } from 'path';

const d = join(process.cwd(), 'img', 'products');

// [id, c1-ciemny, c2-jasny, emoji, shortLabel]
const products = [
  // --- plakaty ---
  ['poster',                          '#1D4ED8','#60A5FA', '🎨', 'Plakaty A3'],
  ['poster-a4',                       '#1E40AF','#93C5FD', '📄', 'Plakaty A4'],
  ['poster-wariant3',                 '#1D4ED8','#A78BFA', '🖼️', 'Plakaty Premium'],
  // --- szablony ---
  ['newsletter',                      '#7C3AED','#C4B5FD', '📰', 'Szablony Nowocz.'],
  ['newsletter-classic',              '#5B21B6','#DDD6FE', '📋', 'Szablon Klas.'],
  ['newsletter-wariant3',             '#4C1D95','#E9D5FF', '✨', 'Szablony Plus'],
  // --- boze-narodzenie ---
  ['boze-narodzenie-zestaw',          '#14532D','#86EFAC', '🎁', 'BN Zestaw'],
  ['boze-narodzenie-plakaty',         '#7F1D1D','#FCA5A5', '🎄', 'BN Plakaty'],
  ['boze-narodzenie-wariant3',        '#166534','#BBF7D0', '⛄', 'BN Szablony'],
  // --- zima ---
  ['zima-plakaty',                    '#0C4A6E','#7DD3FC', '❄️', 'Zima Plakaty'],
  ['zima-szablony',                   '#0369A1','#BAE6FD', '⛄', 'Zima Szablony'],
  ['zima-wariant3',                   '#0E7490','#A5F3FC', '🌨️', 'Zima Plus'],
  // --- mikolajki ---
  ['mikolajki-plakaty',               '#991B1B','#FCA5A5', '🎅', 'Miko. Plakaty'],
  ['mikolajki-szablony',              '#7C2D12','#FDBA74', '🎁', 'Miko. Szablony'],
  ['mikolajki-wariant3',              '#DC2626','#FEF08A', '🦌', 'Miko. Plus'],
  // --- walentynki ---
  ['walentynki-plakaty',              '#9F1239','#FDA4AF', '❤️', 'Wal. Plakaty'],
  ['walentynki-szablony',             '#881337','#FECDD3', '💌', 'Wal. Szablony'],
  ['walentynki-wariant3',             '#BE123C','#FFE4E6', '💝', 'Wal. Plus'],
  // --- dzien-babci-dziadka ---
  ['dzien-babci-plakaty',             '#9D174D','#FBCFE8', '🌹', 'DB Plakaty'],
  ['dzien-babci-szablony',            '#831843','#F9A8D4', '💖', 'DB Szablony'],
  ['dzien-babci-wariant3',            '#BE185D','#FDF2F8', '🫶', 'DB Plus'],
  // --- dzien-kobiet ---
  ['dzien-kobiet-plakaty',            '#86198F','#F0ABFC', '🌸', 'DK Plakaty'],
  ['dzien-kobiet-szablony',           '#701A75','#E879F9', '💐', 'DK Szablony'],
  ['dzien-kobiet-wariant3',           '#A21CAF','#FAE8FF', '🌺', 'DK Plus'],
  // --- dzien-ziemi ---
  ['dzien-ziemi-plakaty',             '#14532D','#86EFAC', '🌍', 'DZ Plakaty'],
  ['dzien-ziemi-szablony',            '#166534','#A7F3D0', '🌱', 'DZ Szablony'],
  ['dzien-ziemi-wariant3',            '#15803D','#D1FAE5', '♻️', 'DZ Plus'],
  // --- wielkanoc ---
  ['wielkanoc-plakaty',               '#78350F','#FDE68A', '🐣', 'Wlk. Plakaty'],
  ['wielkanoc-szablony',              '#92400E','#FED7AA', '🥚', 'Wlk. Szablony'],
  ['wielkanoc-wariant3',              '#A16207','#FEF9C3', '🐇', 'Wlk. Plus'],
  // --- pierwszy-dzien-wiosny ---
  ['pierwszy-dzien-wiosny-plakaty',   '#14532D','#86EFAC', '🌷', 'PDW Plakaty'],
  ['pierwszy-dzien-wiosny-szablony',  '#065F46','#6EE7B7', '🦋', 'PDW Szablony'],
  ['pierwszy-dzien-wiosny-wariant3',  '#166534','#D1FAE5', '🌼', 'PDW Plus'],
  // --- wiosna ---
  ['wiosna-plakaty',                  '#15803D','#86EFAC', '🦋', 'Wiosna Plakaty'],
  ['wiosna-szablony',                 '#3F6212','#D9F99D', '🌻', 'Wiosna Szablony'],
  ['wiosna-wariant3',                 '#365314','#ECFCCB', '🌾', 'Wiosna Plus'],
  // --- dzien-matki ---
  ['dzien-matki-plakaty',             '#9D174D','#FBCFE8', '💝', 'DM Plakaty'],
  ['dzien-matki-szablony',            '#831843','#F9A8D4', '💟', 'DM Szablony'],
  ['dzien-matki-wariant3',            '#BE185D','#FCE7F3', '🌹', 'DM Plus'],
  // --- konstytucja-3-maja ---
  ['konstytucja-plakaty',             '#991B1B','#FCA5A5', '🏛️', '3 Maja Plakaty'],
  ['konstytucja-szablony',            '#7F1D1D','#FECACA', '⚖️', '3 Maja Szablony'],
  ['konstytucja-wariant3',            '#B91C1C','#FEF2F2', '🇵🇱', '3 Maja Plus'],
  // --- dzien-dziecka ---
  ['dzien-dziecka-plakaty',           '#B45309','#FDE68A', '🎈', 'DD Plakaty'],
  ['dzien-dziecka-szablony',          '#92400E','#FED7AA', '🎉', 'DD Szablony'],
  ['dzien-dziecka-wariant3',          '#D97706','#FEF9C3', '🎊', 'DD Plus'],
  // --- dzien-ojca ---
  ['dzien-ojca-plakaty',              '#1E3A5F','#93C5FD', '👔', 'DO Plakaty'],
  ['dzien-ojca-szablony',             '#1F2937','#9CA3AF', '🎩', 'DO Szablony'],
  ['dzien-ojca-wariant3',             '#374151','#D1D5DB', '🛠️', 'DO Plus'],
  // --- lato ---
  ['lato-plakaty',                    '#92400E','#FDE68A', '☀️', 'Lato Plakaty'],
  ['lato-szablony',                   '#B45309','#FED7AA', '🏄', 'Lato Szablony'],
  ['lato-wariant3',                   '#D97706','#FEF3C7', '🏖️', 'Lato Plus'],
  // --- zakonczenie-roku ---
  ['zakonczenie-roku-plakaty',        '#78350F','#FDE68A', '🎓', 'ZR Plakaty'],
  ['zakonczenie-roku-szablony',       '#451A03','#FED7AA', '🏆', 'ZR Szablony'],
  ['zakonczenie-roku-wariant3',       '#92400E','#FEF3C7', '🎖️', 'ZR Plus'],
  // --- poczatek-roku ---
  ['poczatek-roku-plakaty',           '#1D4ED8','#93C5FD', '🎒', 'PR Plakaty'],
  ['poczatek-roku-szablony',          '#1E3A5F','#BAE6FD', '✏️', 'PR Szablony'],
  ['poczatek-roku-wariant3',          '#065F46','#6EE7B7', '📖', 'PR Plus'],
  // --- jesien ---
  ['jesien-plakaty',                  '#78350F','#FDE68A', '🍂', 'Jesień Plakaty'],
  ['jesien-szablony',                 '#92400E','#FED7AA', '🍁', 'Jesień Szablony'],
  ['jesien-wariant3',                 '#B45309','#FEF3C7', '🍄', 'Jesień Plus'],
  // --- dzien-nauczyciela ---
  ['dzien-nauczyciela-plakaty',       '#075985','#7DD3FC', '📚', 'DN Plakaty'],
  ['dzien-nauczyciela-szablony',      '#0C4A6E','#BAE6FD', '🍎', 'DN Szablony'],
  ['dzien-nauczyciela-wariant3',      '#0369A1','#E0F2FE', '🏫', 'DN Plus'],
  // --- halloween ---
  ['halloween-plakaty',               '#1C1917','#FCD34D', '🎃', 'Halloween Pl.'],
  ['halloween-szablony',              '#292524','#FDE68A', '👻', 'Halloween Sz.'],
  ['halloween-wariant3',              '#44403C','#FEF9C3', '🕷️', 'Halloween Plus'],
  // --- andrzejki ---
  ['andrzejki-plakaty',               '#2E1065','#C4B5FD', '⭐', 'Andrzejki Pl.'],
  ['andrzejki-szablony',              '#4C1D95','#DDD6FE', '🔮', 'Andrzejki Sz.'],
  ['andrzejki-wariant3',              '#5B21B6','#EDE9FE', '🕯️', 'Andrzejki Plus'],
  // --- niepodleglosc ---
  ['niepodleglosc-plakaty',           '#7F1D1D','#FCA5A5', '🦅', '11 Lis. Plakaty'],
  ['niepodleglosc-szablony',          '#1C1917','#9CA3AF', '🏛️', '11 Lis. Szablony'],
  ['niepodleglosc-wariant3',          '#991B1B','#FEE2E2', '🇵🇱', '11 Lis. Plus'],
];

// 6 układów stron – każda wygląda jak inna strona gazety
// [n, layoutFn] — layoutFn(c1,c2) zwraca SVG body elements
function pageLayout(n, c1, c2, emoji) {
  const pageNum = `<text x="374" y="248" font-size="11" text-anchor="end" fill="${c1}" font-family="Arial,sans-serif" opacity=".7">str. ${n}</text>`;
  const titleBar = `<rect x="0" y="0" width="400" height="44" fill="${c1}"/>`;
  const emojiEl = `<text x="22" y="28" font-size="22" dominant-baseline="middle" font-family="Segoe UI Emoji,Apple Color Emoji,sans-serif">${emoji}</text>`;

  const layouts = {
    1: `
      ${titleBar}
      ${emojiEl}
      <text x="52" y="28" font-size="15" font-weight="bold" dominant-baseline="middle" fill="#fff" font-family="Arial,sans-serif">Strona tytułowa</text>
      <rect x="12" y="56" width="376" height="96" rx="4" fill="${c2}" fill-opacity=".35"/>
      <rect x="12" y="56" width="376" height="16" rx="4" fill="${c1}" fill-opacity=".6"/>
      <rect x="22" y="164" width="168" height="8" rx="3" fill="${c1}" fill-opacity=".3"/>
      <rect x="22" y="178" width="240" height="6" rx="3" fill="#888" fill-opacity=".25"/>
      <rect x="22" y="190" width="200" height="6" rx="3" fill="#888" fill-opacity=".2"/>
      <rect x="22" y="202" width="180" height="6" rx="3" fill="#888" fill-opacity=".2"/>
      <rect x="210" y="164" width="170" height="80" rx="4" fill="${c2}" fill-opacity=".25"/>`,
    2: `
      ${titleBar}
      ${emojiEl}
      <text x="52" y="28" font-size="15" font-weight="bold" dominant-baseline="middle" fill="#fff" font-family="Arial,sans-serif">Artykuł główny</text>
      <rect x="12" y="56" width="240" height="140" rx="4" fill="${c2}" fill-opacity=".2"/>
      <rect x="264" y="56" width="124" height="140" rx="4" fill="${c2}" fill-opacity=".35"/>
      <rect x="22" y="66" width="120" height="8" rx="3" fill="${c1}" fill-opacity=".5"/>
      <rect x="22" y="82" width="200" height="6" rx="3" fill="#888" fill-opacity=".25"/>
      <rect x="22" y="94" width="180" height="6" rx="3" fill="#888" fill-opacity=".2"/>
      <rect x="22" y="106" width="200" height="6" rx="3" fill="#888" fill-opacity=".2"/>
      <rect x="22" y="118" width="160" height="6" rx="3" fill="#888" fill-opacity=".2"/>
      <rect x="22" y="130" width="190" height="6" rx="3" fill="#888" fill-opacity=".2"/>`,
    3: `
      ${titleBar}
      ${emojiEl}
      <text x="52" y="28" font-size="15" font-weight="bold" dominant-baseline="middle" fill="#fff" font-family="Arial,sans-serif">Aktualności</text>
      <rect x="12" y="56" width="120" height="80" rx="4" fill="${c2}" fill-opacity=".35"/>
      <rect x="144" y="56" width="112" height="80" rx="4" fill="${c2}" fill-opacity=".25"/>
      <rect x="268" y="56" width="120" height="80" rx="4" fill="${c2}" fill-opacity=".35"/>
      <rect x="12" y="148" width="376" height="6" rx="3" fill="#888" fill-opacity=".25"/>
      <rect x="12" y="160" width="300" height="6" rx="3" fill="#888" fill-opacity=".2"/>
      <rect x="12" y="172" width="340" height="6" rx="3" fill="#888" fill-opacity=".2"/>
      <rect x="12" y="184" width="260" height="6" rx="3" fill="#888" fill-opacity=".2"/>`,
    4: `
      ${titleBar}
      ${emojiEl}
      <text x="52" y="28" font-size="15" font-weight="bold" dominant-baseline="middle" fill="#fff" font-family="Arial,sans-serif">Galeria zdjęć</text>
      <rect x="12" y="56" width="180" height="110" rx="4" fill="${c2}" fill-opacity=".3"/>
      <rect x="204" y="56" width="85" height="52" rx="4" fill="${c2}" fill-opacity=".25"/>
      <rect x="304" y="56" width="84" height="52" rx="4" fill="${c2}" fill-opacity=".35"/>
      <rect x="204" y="114" width="85" height="52" rx="4" fill="${c2}" fill-opacity=".35"/>
      <rect x="304" y="114" width="84" height="52" rx="4" fill="${c2}" fill-opacity=".25"/>
      <rect x="12" y="178" width="376" height="6" rx="3" fill="#888" fill-opacity=".2"/>
      <rect x="12" y="190" width="280" height="6" rx="3" fill="#888" fill-opacity=".2"/>`,
    5: `
      ${titleBar}
      ${emojiEl}
      <text x="52" y="28" font-size="15" font-weight="bold" dominant-baseline="middle" fill="#fff" font-family="Arial,sans-serif">Wywiad / Quiz</text>
      <rect x="12" y="56" width="376" height="50" rx="4" fill="${c2}" fill-opacity=".2"/>
      <rect x="22" y="63" width="6" height="36" rx="2" fill="${c1}" fill-opacity=".8"/>
      <rect x="38" y="68" width="200" height="8" rx="3" fill="${c1}" fill-opacity=".4"/>
      <rect x="38" y="82" width="160" height="6" rx="3" fill="#888" fill-opacity=".25"/>
      <rect x="12" y="118" width="376" height="50" rx="4" fill="${c2}" fill-opacity=".3"/>
      <rect x="22" y="125" width="6" height="36" rx="2" fill="${c1}" fill-opacity=".8"/>
      <rect x="38" y="130" width="180" height="8" rx="3" fill="${c1}" fill-opacity=".4"/>
      <rect x="38" y="144" width="140" height="6" rx="3" fill="#888" fill-opacity=".25"/>
      <rect x="12" y="180" width="376" height="30" rx="4" fill="${c2}" fill-opacity=".15"/>`,
    6: `
      ${titleBar}
      ${emojiEl}
      <text x="52" y="28" font-size="15" font-weight="bold" dominant-baseline="middle" fill="#fff" font-family="Arial,sans-serif">Ogłoszenia / Stopka</text>
      <rect x="12" y="56" width="180" height="24" rx="4" fill="${c1}" fill-opacity=".15"/>
      <rect x="204" y="56" width="184" height="24" rx="4" fill="${c1}" fill-opacity=".15"/>
      <rect x="12" y="88" width="376" height="70" rx="4" fill="${c2}" fill-opacity=".2"/>
      <rect x="22" y="100" width="100" height="8" rx="3" fill="${c1}" fill-opacity=".5"/>
      <rect x="22" y="114" width="240" height="6" rx="3" fill="#888" fill-opacity=".25"/>
      <rect x="22" y="126" width="200" height="6" rx="3" fill="#888" fill-opacity=".2"/>
      <rect x="0" y="220" width="400" height="40" fill="${c1}" fill-opacity=".12"/>
      <rect x="12" y="232" width="120" height="6" rx="3" fill="${c1}" fill-opacity=".4"/>
      <rect x="200" y="232" width="80" height="6" rx="3" fill="${c1}" fill-opacity=".3"/>`,
  };
  return (layouts[n] || layouts[1]) + '\n      ' + pageNum;
}

let count = 0;
for (const [id, c1, c2, emoji, label] of products) {
  for (let v = 1; v <= 6; v++) {
    const inner = pageLayout(v, c1, c2, emoji);
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 260">
  <rect width="400" height="260" fill="#fafafa"/>
  <rect width="400" height="260" fill="${c2}" fill-opacity=".08"/>
  ${inner}
</svg>`;
    writeFileSync(join(d, `prod-${id}-v${v}.svg`), svg, 'utf8');
    count++;
  }
}
console.log(`Generated ${count} page-preview SVGs`);
