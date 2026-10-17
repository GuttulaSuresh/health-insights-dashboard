// Regenerates src/content/usda-nutrients.json from the USDA National Nutrient Database for Standard Reference,
// Release 28 (public domain). Only the foods referenced by src/content/foodCatalog.js and the "foods to limit"
// examples are kept, with the nutrients the recommendation engine uses (per 100 g).
//
// Usage: node scripts/build-foods.mjs <path to ABBREV.txt>
// ABBREV.txt is in USDA's "sr28abbr" download, and in the fda-nutrient-database npm package (data/ABBREV.txt).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FOOD_CATALOG } from '../src/content/foodCatalog.js';
import { LIMITS } from '../src/content/foods.js';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = path.join(root, 'src', 'content', 'usda-nutrients.json');

// Column positions in ABBREV.txt (SR28 documentation, "Abbreviated file").
export const COLUMNS = {
  kcal: 3, protein: 4, fat: 5, carbs: 7, fiber: 8, sugar: 9, calcium: 10, iron: 11, magnesium: 12, potassium: 14,
  sodium: 15, zinc: 16, vitaminC: 20, folate: 29, vitaminB12: 31, vitaminD: 41, satFat: 44, monoFat: 45, polyFat: 46,
  cholesterol: 47,
};

export function parseAbbrevLine(line) {
  const f = line.split('^').map((x) => x.replace(/^~|~$/g, ''));
  const nutrients = {};
  for (const [key, i] of Object.entries(COLUMNS)) nutrients[key] = f[i] === '' || f[i] === undefined ? null : Number(f[i]);
  return { ndb: f[0], description: f[1], nutrients };
}

function main() {
  const src = process.argv[2];
  if (!src) {
    console.error('Usage: node scripts/build-foods.mjs <path to ABBREV.txt>');
    process.exit(1);
  }
  const wanted = new Set([...FOOD_CATALOG.map((f) => f.ndb), ...LIMITS.map((l) => l.example?.ndb).filter(Boolean)]);
  const rows = {};
  for (const line of fs.readFileSync(src, 'latin1').split(/\r?\n/)) {
    if (!line.trim()) continue;
    const row = parseAbbrevLine(line);
    if (wanted.has(row.ndb)) rows[row.ndb] = { description: row.description, ...row.nutrients };
  }
  const missing = [...wanted].filter((id) => !rows[id]);
  if (missing.length) {
    console.error(`Not found in ${src}: ${missing.join(', ')}`);
    process.exit(1);
  }
  const sorted = Object.fromEntries(Object.keys(rows).sort().map((k) => [k, rows[k]]));
  const doc = {
    source: 'USDA National Nutrient Database for Standard Reference, Release 28 (2015, slightly revised 2016). Public domain.',
    units: { kcal: 'kcal', protein: 'g', fat: 'g', carbs: 'g', fiber: 'g', sugar: 'g', calcium: 'mg', iron: 'mg', magnesium: 'mg', potassium: 'mg', sodium: 'mg', zinc: 'mg', vitaminC: 'mg', folate: 'µg DFE', vitaminB12: 'µg', vitaminD: 'µg', satFat: 'g', monoFat: 'g', polyFat: 'g', cholesterol: 'mg' },
    per: '100 g edible portion',
    foods: sorted,
  };
  fs.writeFileSync(out, `${JSON.stringify(doc, null, 1)}\n`);
  console.log(`Wrote ${Object.keys(sorted).length} foods to ${path.relative(root, out)}`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main();
