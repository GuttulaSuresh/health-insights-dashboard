import test from 'node:test';
import assert from 'node:assert/strict';
import NUTRIENTS from '../src/content/usda-nutrients.json' with { type: 'json' };
import { FOOD_CATALOG, FOOD_SECTIONS } from '../src/content/foodCatalog.js';
import { MEALS, MEAL_SLOTS } from '../src/content/meals.js';
import { LIMITS } from '../src/content/foods.js';
import { nutrientsFor, SCORED_BY_ID } from '../src/lib/foodScore.js';
import { topFoods, eatMore, weekPlan, foodsToLimit, MEAL_INFO, mealPlate } from '../src/lib/nutrition.js';
import { ALLERGENS } from '../src/lib/preferences.js';
import { parseAbbrevLine } from '../scripts/build-foods.mjs';

const DIETS = ['vegan', 'vegetarian', 'egg', 'fish', 'meat'];
const NON_VEG = new Set(['egg', 'fish', 'meat']);
const ALLERGEN_IDS = ALLERGENS.map((a) => a.id);
const needs = (weights) => ({ weights, evidence: {} });
const prefs = (p) => ({ diet: 'all', cuisine: 'both', avoid: [], hidden: [], ...p });

test('every food has USDA data and valid tags', () => {
  const ids = new Set();
  for (const f of FOOD_CATALOG) {
    assert.ok(!ids.has(f.id), `duplicate id ${f.id}`);
    ids.add(f.id);
    assert.ok(NUTRIENTS.foods[f.ndb], `${f.id}: NDB ${f.ndb} missing from usda-nutrients.json`);
    assert.ok(f.g > 0 && f.serving, `${f.id}: serving`);
    assert.ok(DIETS.includes(f.diet), `${f.id}: diet ${f.diet}`);
    assert.ok(f.cuisine.length && f.cuisine.every((c) => c === 'indian' || c === 'western'), `${f.id}: cuisine`);
    assert.ok(f.allergens.every((a) => ALLERGEN_IDS.includes(a)), `${f.id}: allergens`);
    assert.ok(FOOD_SECTIONS.some((s) => s.name === f.section), `${f.id}: section ${f.section}`);
  }
  assert.ok(FOOD_CATALOG.length >= 120, 'library has at least 120 foods');
  for (const l of LIMITS.filter((x) => x.example)) assert.ok(NUTRIENTS.foods[l.example.ndb], `limit example ${l.id}`);
});

test('nutrients are scaled from per-100 g USDA values to the serving', () => {
  const lentils = nutrientsFor('16070', 99);
  assert.equal(Math.round(lentils.fiber * 100) / 100, Math.round(7.9 * 0.99 * 100) / 100);
  assert.equal(lentils.netCarbs, Math.max(0, lentils.carbs - lentils.fiber));
});

test('the build script parses SR28 abbreviated rows', () => {
  const row = parseAbbrevLine('~16070~^~LENTILS,MATURE SEEDS,CKD,BLD,WO/SALT~^69.64^116^9.02^0.38^1.03^20.13^7.9^1.80^19^3.33^36^180^369^2^1.27^0.251^0.494^2.8^1.5^0.169^0.073^1.060^0.638^0.178^181^0^181^181^32.7^0.00^8^0^0^0^5^0^0^0^0.11^0.0^0^1.7^0.053^0.064^0.175^0^198^~1 cup~^0^~~^0');
  assert.equal(row.ndb, '16070');
  assert.equal(row.nutrients.fiber, 7.9);
  assert.equal(row.nutrients.folate, 181);
  assert.equal(row.nutrients.cholesterol, 0);
});

test('meals only use known foods and every slot has vegetarian and vegan options', () => {
  for (const m of MEALS) {
    assert.ok(MEAL_SLOTS.includes(m.slot), m.id);
    for (const [id, servings] of m.items) assert.ok(SCORED_BY_ID[id] && servings > 0, `${m.id} uses ${id}`);
  }
  for (const slot of MEAL_SLOTS) {
    const inSlot = MEAL_INFO.filter((m) => m.slot === slot);
    assert.ok(inSlot.filter((m) => !NON_VEG.has(m.diet)).length >= 7, `${slot}: vegetarian meals`);
    assert.ok(inSlot.filter((m) => m.diet === 'vegan').length >= 3, `${slot}: vegan meals`);
  }
  assert.equal(MEAL_INFO.find((m) => m.id === 'chicken_curry_roti').diet, 'meat');
  assert.deepEqual(MEAL_INFO.find((m) => m.id === 'moong_chilla').allergens, ['dairy']);
});

test('vegetarian and vegan preferences remove animal foods everywhere', () => {
  const n = needs({ iron: 3, b12: 3, vitd: 2 });
  const veg = prefs({ diet: 'vegetarian' });
  assert.ok(topFoods(n, 10, veg).every((f) => !NON_VEG.has(f.diet)));
  assert.ok(eatMore(n, veg).every((s) => s.items.every((f) => !NON_VEG.has(f.diet))));
  const week = weekPlan(n, veg, { start: new Date(2026, 9, 17) });
  assert.ok(week.every((d) => d.meals.every((s) => [s.main, s.alt].filter(Boolean).every((m) => !NON_VEG.has(m.diet)))));
  const vegan = prefs({ diet: 'vegan' });
  assert.ok(topFoods(n, 10, vegan).every((f) => f.diet === 'vegan'));
  assert.ok(topFoods(n, 10, prefs()).some((f) => NON_VEG.has(f.diet)), 'without a filter, animal sources of B12 rank');
});

test('allergies, cuisine and hidden foods are respected', () => {
  const n = needs({ ldl: 3, hdl: 2 });
  const noNuts = topFoods(n, 10, prefs({ avoid: ['treenut', 'peanut'] }));
  assert.ok(noNuts.every((f) => !f.allergens.includes('treenut') && !f.allergens.includes('peanut')));
  const indian = topFoods(n, 10, prefs({ cuisine: 'indian' }));
  assert.ok(indian.every((f) => f.cuisine.includes('indian')));
  const first = topFoods(n, 10, prefs())[0];
  assert.ok(!topFoods(n, 10, prefs({ hidden: [first.id] })).some((f) => f.id === first.id));
  const westernWeek = weekPlan(n, prefs({ cuisine: 'western' }), { start: new Date(2026, 9, 17) });
  assert.ok(westernWeek.every((d) => d.meals.every((s) => !s.main || s.main.cuisine.includes('western'))));
});

test('rankings follow the nutrients behind each need', () => {
  const iron = topFoods(needs({ iron: 3 }), 5, prefs({ diet: 'vegetarian' }));
  assert.ok(iron.every((f) => f.facts.some((x) => /iron|vitamin C/.test(x))), 'iron picks cite iron or vitamin C');
  const vitd = topFoods(needs({ vitd: 3 }), 3, prefs());
  assert.ok(vitd.every((f) => SCORED_BY_ID[f.id].nutrients.vitaminD > 2), 'vitamin D picks contain vitamin D');
  const ldl = topFoods(needs({ ldl: 3 }), 10, prefs());
  assert.ok(ldl.every((f) => SCORED_BY_ID[f.id].nutrients.satFat < 3), 'LDL picks are low in saturated fat');
});

test('the week plan is varied, repeatable within a week and changes the next week', () => {
  const n = needs({ glycemic: 2 });
  const a = weekPlan(n, prefs(), { start: new Date(2026, 9, 14), seed: 'p1' });
  const b = weekPlan(n, prefs(), { start: new Date(2026, 9, 14), seed: 'p1' });
  assert.deepEqual(a, b);
  assert.equal(a.length, 7);
  for (const slot of MEAL_SLOTS) {
    const mains = a.map((d) => d.meals.find((s) => s.slot === slot).main.id);
    assert.equal(new Set(mains).size, 7, `${slot} repeats within the week`);
  }
  const next = weekPlan(n, prefs(), { start: new Date(2026, 9, 21), seed: 'p1' });
  assert.notDeepEqual(a.map((d) => d.meals.map((s) => s.main.id)), next.map((d) => d.meals.map((s) => s.main.id)));
});

test('limits show the nutrient that makes them worth limiting, and the plate follows the diet', () => {
  const limits = foodsToLimit(needs({ glycemic: 2, ldl: 2 }));
  assert.match(limits.find((l) => l.id === 'sugary_drinks').exampleText, /g sugar/);
  assert.match(limits.find((l) => l.id === 'satfat').exampleText, /saturated fat/);
  const veganPlate = mealPlate(needs({ b12: 3 }), prefs({ diet: 'vegan' }));
  assert.ok(!/eggs|fish|chicken|paneer/.test(veganPlate.examples.protein.join(' ')));
  assert.ok(veganPlate.notes.some((x) => /fortified/.test(x)));
});
