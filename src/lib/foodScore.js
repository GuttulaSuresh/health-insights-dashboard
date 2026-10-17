// Scores foods against lab-driven needs from their USDA nutrient values per serving. Every reason shown to the
// user is built from the same numbers, so a suggestion can always be traced back to its nutrient data.
import NUTRIENT_DATA from '../content/usda-nutrients.json' with { type: 'json' };
import { FOOD_CATALOG } from '../content/foodCatalog.js';

// FDA Daily Values (adults, 2016 labeling rule), used to express amounts as a share of a day's needs.
export const DAILY_VALUE = {
  fiber: 28, satFat: 20, cholesterol: 300, sugar: 50, iron: 18, vitaminC: 90, vitaminD: 20, vitaminB12: 2.4,
  folate: 400, sodium: 2300, protein: 50, carbs: 275, potassium: 4700, calcium: 1300, magnesium: 420,
};

const LABEL = {
  fiber: 'fiber', satFat: 'saturated fat', cholesterol: 'cholesterol', sugar: 'sugar', iron: 'iron', vitaminC: 'vitamin C',
  vitaminD: 'vitamin D', vitaminB12: 'vitamin B12', folate: 'folate', sodium: 'sodium', protein: 'protein',
  unsatFat: 'unsaturated fat', netCarbs: 'net carbs',
};

const UNIT = NUTRIENT_DATA.units;

/** Nutrients for `grams` of the USDA entry `ndb`. Missing values count as 0. */
export function nutrientsFor(ndb, grams) {
  const row = NUTRIENT_DATA.foods[ndb];
  if (!row) throw new Error(`No USDA nutrient data for NDB ${ndb}`);
  const out = {};
  for (const key of Object.keys(UNIT)) out[key] = ((row[key] ?? 0) * grams) / 100;
  out.unsatFat = out.monoFat + out.polyFat;
  out.netCarbs = Math.max(0, out.carbs - out.fiber);
  return out;
}

export function usdaDescription(ndb) {
  return NUTRIENT_DATA.foods[ndb]?.description ?? null;
}

const pct = (n, key) => n[key] / DAILY_VALUE[key];
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

function round(v) {
  if (v >= 100) return Math.round(v);
  if (v >= 10) return Math.round(v * 10) / 10;
  return Math.round(v * 100) / 100 >= 1 ? Math.round(v * 10) / 10 : Math.round(v * 100) / 100;
}

/** "15.6 g fiber (56% DV)" */
export function factText(key, n) {
  const unit = key === 'unsatFat' || key === 'netCarbs' ? 'g' : UNIT[key];
  const amount = `${round(n[key])} ${unit} ${LABEL[key]}`;
  return DAILY_VALUE[key] ? `${amount} (${Math.round(pct(n, key) * 100)}% DV)` : amount;
}

const OMEGA3_BONUS = { marine: 1, ala: 0.5 };

// Each scorer returns a value roughly between -2 and 3, the nutrients that drove it, and a one-line mechanism.
const SCORERS = {
  glycemic: (n) => ({
    value: 2 * pct(n, 'fiber') + pct(n, 'protein') - 0.8 * pct(n, 'sugar') - 0.5 * (n.netCarbs / 45),
    good: ['fiber', 'protein'], bad: ['sugar', 'netCarbs'],
    why: 'Fiber and protein slow the rise in blood sugar; sugar and starchy carbs speed it up.',
  }),
  triglycerides: (n, f) => ({
    value: 1.5 * pct(n, 'fiber') - 1.5 * pct(n, 'sugar') - 0.4 * (n.netCarbs / 45) + (OMEGA3_BONUS[f.omega3] || 0),
    good: ['fiber'], bad: ['sugar', 'netCarbs'], omega3: f.omega3,
    why: 'Omega-3 fats and fiber help lower triglycerides; sugar and refined carbs raise them.',
  }),
  ldl: (n) => ({
    value: 2 * pct(n, 'fiber') - 2 * pct(n, 'satFat') - 0.5 * pct(n, 'cholesterol') + 0.5 * Math.min(n.unsatFat / 10, 1),
    good: ['fiber', 'unsatFat'], bad: ['satFat', 'cholesterol'],
    why: 'Fiber and unsaturated fats help lower LDL; saturated fat raises it.',
  }),
  hdl: (n, f) => ({
    value: Math.min(n.unsatFat / 10, 1.2) + (OMEGA3_BONUS[f.omega3] || 0) * 0.6 - 0.5 * pct(n, 'sugar'),
    good: ['unsatFat'], bad: ['sugar'], omega3: f.omega3,
    why: 'Unsaturated and omega-3 fats support HDL; diets heavy in sugar tend to lower it.',
  }),
  iron: (n, f) => ({
    value: 2 * pct(n, 'iron') * (f.heme ? 1.5 : 1) + 0.5 * Math.min(pct(n, 'vitaminC'), 1),
    good: ['iron', 'vitaminC'], bad: [],
    why: f.heme ? 'Iron from meat, fish and poultry is absorbed well.' : 'Plant iron absorbs best with vitamin C in the same meal.',
  }),
  vitd: (n) => ({ value: 3 * pct(n, 'vitaminD'), good: ['vitaminD'], bad: [], why: 'Few foods contain vitamin D, so each source counts.' }),
  b12: (n) => ({ value: Math.min(2 * pct(n, 'vitaminB12'), 3), good: ['vitaminB12'], bad: [], why: 'B12 comes almost only from animal foods and fortified foods.' }),
  folate: (n) => ({ value: 2 * pct(n, 'folate'), good: ['folate'], bad: [], why: 'Folate is found in legumes, leafy greens and liver.' }),
  liver: (n) => ({
    value: pct(n, 'fiber') - pct(n, 'sugar') - pct(n, 'satFat'),
    good: ['fiber'], bad: ['sugar', 'satFat'],
    why: 'Less sugar and saturated fat and more fiber support a healthy liver.',
  }),
  kidney: (n) => ({ value: -2 * pct(n, 'sodium'), good: [], bad: ['sodium'], why: 'Lower-sodium foods are easier on blood pressure and the kidneys.' }),
};

export const SCORED_NEEDS = Object.keys(SCORERS);

/** Per-need breakdown for one food (or meal) given its nutrients. */
export function scoreNeeds(n, food = {}) {
  const out = {};
  for (const [need, fn] of Object.entries(SCORERS)) {
    const r = fn(n, food);
    out[need] = { ...r, value: clamp(r.value, -2, 3) };
  }
  return out;
}

/** Total score for weighted needs, and the per-need parts that contributed. */
export function weightedScore(breakdown, weights) {
  let total = 0;
  const parts = [];
  for (const [need, w] of Object.entries(weights)) {
    const b = breakdown[need];
    if (!b || !w) continue;
    total += w * b.value;
    parts.push({ need, weight: w, value: b.value, contribution: w * b.value });
  }
  parts.sort((a, b) => b.contribution - a.contribution);
  return { total, parts };
}

/** Nutrient facts worth showing for these needs: helpful ones first, then the ones to watch. */
export function factsFor(n, breakdown, needs) {
  const good = [];
  const bad = [];
  for (const need of needs) {
    const b = breakdown[need];
    if (!b) continue;
    for (const k of b.good) if (!good.includes(k) && (k === 'unsatFat' ? n[k] >= 3 : pct(n, k) >= 0.05)) good.push(k);
    for (const k of b.bad) if (!bad.includes(k) && (DAILY_VALUE[k] ? pct(n, k) >= 0.15 : n[k] >= 20)) bad.push(k);
  }
  good.sort((a, b) => (DAILY_VALUE[b] ? pct(n, b) : 0) - (DAILY_VALUE[a] ? pct(n, a) : 0));
  return { good: good.slice(0, 3).map((k) => factText(k, n)), watch: bad.slice(0, 2).map((k) => factText(k, n)) };
}

// Precomputed nutrients and per-need scores for the whole catalog.
export const SCORED_FOODS = FOOD_CATALOG.map((f) => {
  const n = nutrientsFor(f.ndb, f.g);
  return { ...f, nutrients: n, breakdown: scoreNeeds(n, f) };
});
export const SCORED_BY_ID = Object.fromEntries(SCORED_FOODS.map((f) => [f.id, f]));
