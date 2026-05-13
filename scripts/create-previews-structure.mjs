/**
 * create-previews-structure.mjs
 *
 * Creates the folder tree:
 *   previews/{catId}/wariant-{1,2,3}/grafika-{1..N}.svg
 *
 * Files are copied from img/products/prod-{productId}-v{n}.svg.
 * Run once (or re-run to refresh) whenever you regenerate the source SVGs.
 *
 * Usage: node scripts/create-previews-structure.mjs
 */

import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root      = join(__dirname, "..");
const srcDir    = join(root, "img", "products");
const destRoot  = join(root, "previews");

// ─── category → [wariant-1 productId, wariant-2 productId, wariant-3 productId]
const CATEGORIES = {
  "plakaty":                   ["poster",                         "poster-a4",                          "poster-wariant3"],
  "szablony":                  ["newsletter",                     "newsletter-classic",                  "newsletter-wariant3"],
  "boze-narodzenie":           ["boze-narodzenie-zestaw",         "boze-narodzenie-plakaty",             "boze-narodzenie-wariant3"],
  "zima":                      ["zima-plakaty",                   "zima-szablony",                       "zima-wariant3"],
  "mikolajki":                 ["mikolajki-plakaty",              "mikolajki-szablony",                  "mikolajki-wariant3"],
  "walentynki":                ["walentynki-plakaty",             "walentynki-szablony",                 "walentynki-wariant3"],
  "dzien-babci-dziadka":       ["dzien-babci-plakaty",            "dzien-babci-szablony",                "dzien-babci-wariant3"],
  "dzien-kobiet":              ["dzien-kobiet-plakaty",           "dzien-kobiet-szablony",               "dzien-kobiet-wariant3"],
  "pierwszy-dzien-wiosny":     ["pierwszy-dzien-wiosny-plakaty",  "pierwszy-dzien-wiosny-szablony",      "pierwszy-dzien-wiosny-wariant3"],
  "wielkanoc":                 ["wielkanoc-plakaty",              "wielkanoc-szablony",                  "wielkanoc-wariant3"],
  "dzien-ziemi":               ["dzien-ziemi-plakaty",            "dzien-ziemi-szablony",                "dzien-ziemi-wariant3"],
  "wiosna":                    ["wiosna-plakaty",                 "wiosna-szablony",                     "wiosna-wariant3"],
  "konstytucja-3-maja":        ["konstytucja-plakaty",            "konstytucja-szablony",                "konstytucja-wariant3"],
  "dzien-matki":               ["dzien-matki-plakaty",            "dzien-matki-szablony",                "dzien-matki-wariant3"],
  "dzien-dziecka":             ["dzien-dziecka-plakaty",          "dzien-dziecka-szablony",              "dzien-dziecka-wariant3"],
  "dzien-ojca":                ["dzien-ojca-plakaty",             "dzien-ojca-szablony",                 "dzien-ojca-wariant3"],
  "lato":                      ["lato-plakaty",                   "lato-szablony",                       "lato-wariant3"],
  "zakonczenie-roku":          ["zakonczenie-roku-plakaty",       "zakonczenie-roku-szablony",           "zakonczenie-roku-wariant3"],
  "poczatek-roku":             ["poczatek-roku-plakaty",          "poczatek-roku-szablony",              "poczatek-roku-wariant3"],
  "jesien":                    ["jesien-plakaty",                 "jesien-szablony",                     "jesien-wariant3"],
  "dzien-nauczyciela":         ["dzien-nauczyciela-plakaty",      "dzien-nauczyciela-szablony",          "dzien-nauczyciela-wariant3"],
  "halloween":                 ["halloween-plakaty",              "halloween-szablony",                  "halloween-wariant3"],
  "andrzejki":                 ["andrzejki-plakaty",              "andrzejki-szablony",                  "andrzejki-wariant3"],
  "niepodleglosc":             ["niepodleglosc-plakaty",          "niepodleglosc-szablony",              "niepodleglosc-wariant3"],
};

// Clean and recreate root previews folder
if (existsSync(destRoot)) {
  rmSync(destRoot, { recursive: true, force: true });
}
mkdirSync(destRoot, { recursive: true });

let copied = 0;
let missing = 0;

for (const [catId, productIds] of Object.entries(CATEGORIES)) {
  productIds.forEach((productId, variantIndex) => {
    const variantFolder = join(destRoot, catId, `wariant-${variantIndex + 1}`);
    mkdirSync(variantFolder, { recursive: true });

    // Discover how many grafika-N.svg source files exist for this product
    let pageNum = 1;
    while (true) {
      const srcFile = join(srcDir, `prod-${productId}-v${pageNum}.svg`);
      if (!existsSync(srcFile)) break;

      const destFile = join(variantFolder, `grafika-${pageNum}.svg`);
      copyFileSync(srcFile, destFile);
      copied++;
      pageNum++;
    }

    if (pageNum === 1) {
      // No files found for this product
      console.warn(`  ⚠ Brak pliku źródłowego: prod-${productId}-v1.svg`);
      missing++;
    }
  });
}

console.log(`✅ Struktura previews gotowa: ${copied} plików skopiowanych, ${missing} produktów bez pliku.`);

// Show summary tree
console.log(`\nStruktura (3 pierwsze kategorie):`);
let shown = 0;
for (const catId of Object.keys(CATEGORIES)) {
  if (shown >= 3) break;
  const catDir = join(destRoot, catId);
  const variants = readdirSync(catDir).sort();
  for (const v of variants) {
    const vDir = join(catDir, v);
    const files = readdirSync(vDir).sort();
    console.log(`  previews/${catId}/${v}/  (${files.length} pliki)`);
  }
  shown++;
}
