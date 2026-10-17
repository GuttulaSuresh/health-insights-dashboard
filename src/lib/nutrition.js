// Food recommendation engine. Input: one profile's `needs` (from its own findings and trends) and that profile's
// food preferences. Output: ranked foods, eat-more sections, limits, swaps, a 7-day plan and a plate.
// Nothing here can see another profile.
import { LIMITS, SWAPS, HABITS, NEED_LABEL } from '../content/foods.js';
import { FOOD_SECTIONS } from '../content/foodCatalog.js';
import { MEALS, MEAL_SLOTS } from '../content/meals.js';
import { SCORED_FOODS, SCORED_BY_ID, nutrientsFor, scoreNeeds, weightedScore, factsFor, factText } from './foodScore.js';
import { DEFAULT_PREFERENCES, fits, dietOf, isVegetarianDiet, allowsDiet } from './preferences.js';
import { fmt } from './insights.js';

// Used when a profile has no flagged results: a gentle, generally healthy ranking.
export const GENERAL_WEIGHTS = { glycemic: 1, ldl: 1, triglycerides: 0.5 };

function evidenceText(need, evidence) {
  const recs = evidence?.[need] || [];
  const uniq = [...new Map(recs.map((r) => [r.marker_id, r])).values()];
  return uniq.slice(0, 3).map(fmt);
}

const activeWeights = (needs) => (Object.keys(needs.weights || {}).length ? needs.weights : GENERAL_WEIGHTS);

export function ideasFor(item, prefs) {
  const ideas = item.ideas || {};
  if (prefs.cuisine === 'indian') return ideas.indian || ideas.western || '';
  if (prefs.cuisine === 'western') return ideas.western || ideas.indian || '';
  return [ideas.indian, ideas.western].filter(Boolean).join('; ');
}

function foodView(f, needs, prefs) {
  const w = activeWeights(needs);
  const { total, parts } = weightedScore(f.breakdown, w);
  const helping = parts.filter((p) => p.contribution > 0.05).map((p) => p.need);
  const facts = factsFor(f.nutrients, f.breakdown, helping.length ? helping : Object.keys(w));
  const why = helping.slice(0, 2).map((n) => f.breakdown[n].why).filter((x, i, a) => a.indexOf(x) === i);
  const omega = f.omega3 && helping.some((n) => n === 'triglycerides' || n === 'hdl')
    ? (f.omega3 === 'marine' ? 'A source of marine omega-3 fats (EPA and DHA).' : 'A source of plant omega-3 fat (ALA).')
    : null;
  return {
    ...f,
    score: total,
    ideasText: ideasFor(f, prefs),
    supportsAreas: helping.map((n) => NEED_LABEL[n]),
    supportsLabs: helping.flatMap((n) => evidenceText(n, needs.evidence)).filter((x, i, a) => a.indexOf(x) === i).slice(0, 4),
    facts: facts.good,
    watch: facts.watch,
    reason: [...why, omega].filter(Boolean).join(' '),
  };
}

function eligibleFoods(prefs) {
  return SCORED_FOODS.filter((f) => !f.mealOnly && fits(prefs, f));
}

/** The best foods for these needs and preferences, at most one or two per food group. */
export function topFoods(needs, n = 10, prefs = DEFAULT_PREFERENCES) {
  const ranked = eligibleFoods(prefs).map((f) => foodView(f, needs, prefs)).filter((f) => f.score > 0.15).sort((a, b) => b.score - a.score);
  const groupCount = {};
  const out = [];
  for (const f of ranked) {
    const max = f.group === 'legume' ? 2 : 1;
    if ((groupCount[f.group] || 0) >= max) continue;
    groupCount[f.group] = (groupCount[f.group] || 0) + 1;
    out.push(f);
    if (out.length === n) break;
  }
  return out;
}

/** Foods that best match one need, for the Q&A answers. */
export function foodsForNeed(need, prefs = DEFAULT_PREFERENCES, n = 6) {
  return topFoods({ weights: { [need]: 3 }, evidence: {} }, n, prefs);
}

export const EAT_MORE_SECTIONS = FOOD_SECTIONS;

export function eatMore(needs, prefs = DEFAULT_PREFERENCES) {
  const eligible = eligibleFoods(prefs);
  return FOOD_SECTIONS.map((s) => {
    const items = eligible.filter((f) => f.section === s.name).map((f) => foodView(f, needs, prefs)).sort((a, b) => b.score - a.score);
    const relevant = items.filter((f) => f.score > 0.15).slice(0, 3);
    return { ...s, items: relevant.length ? relevant : items.slice(0, 1), general: !relevant.length, empty: !items.length };
  }).filter((s) => !s.empty);
}

export function foodsToLimit(needs) {
  const w = needs.weights;
  return LIMITS.map((l) => ({ ...l, active: l.needs.filter((n) => w[n]) }))
    .filter((l) => l.active.length)
    .map((l) => ({
      ...l,
      s: l.active.reduce((s, n) => s + w[n], 0),
      labs: l.active.flatMap((n) => evidenceText(n, needs.evidence)).filter((x, i, a) => a.indexOf(x) === i).slice(0, 3),
      exampleText: l.example ? limitExample(l.example) : null,
    }))
    .sort((a, b) => b.s - a.s);
}

function limitExample(ex) {
  const n = nutrientsFor(ex.ndb, ex.g);
  const keys = ['sugar', 'satFat', 'sodium', 'netCarbs'].filter((k) => (k === 'netCarbs' ? n.netCarbs >= 30 && n.fiber < 2 : n[k] / { sugar: 50, satFat: 20, sodium: 2300 }[k] >= 0.2));
  if (!keys.length) return null;
  return `${ex.serving}: ${keys.map((k) => factText(k, n)).join(', ')}`;
}

export function foodSwaps(needs) {
  return SWAPS.filter((s) => s.needs.some((n) => needs.weights[n]));
}

export function habitsFor(needs) {
  return HABITS.filter((h) => h.needs.some((n) => needs.weights[n]));
}

// Meals are scored from the summed nutrients of their foods.
export const MEAL_INFO = MEALS.map((meal) => {
  const foods = meal.items.map(([id]) => {
    const f = SCORED_BY_ID[id];
    if (!f) throw new Error(`Meal "${meal.id}" uses unknown food "${id}"`);
    return f;
  });
  const total = {};
  meal.items.forEach(([id, servings]) => {
    const f = SCORED_BY_ID[id];
    const n = nutrientsFor(f.ndb, f.g * servings);
    for (const [k, v] of Object.entries(n)) total[k] = (total[k] || 0) + v;
  });
  const omega3 = foods.some((f) => f.omega3 === 'marine') ? 'marine' : foods.some((f) => f.omega3 === 'ala') ? 'ala' : null;
  return {
    ...meal,
    foods: foods.map((f) => f.id),
    diet: dietOf(foods),
    allergens: [...new Set(foods.flatMap((f) => f.allergens))],
    cuisine: meal.cuisine === 'any' ? ['indian', 'western'] : [meal.cuisine],
    nutrients: total,
    breakdown: scoreNeeds(total, { omega3, heme: foods.some((f) => f.heme) }),
  };
});

function hash(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

function isoWeek(d) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const day = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return `${t.getUTCFullYear()}-${Math.ceil(((t - yearStart) / 86400000 + 1) / 7)}`;
}

const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function mealView(meal, w) {
  const { total, parts } = weightedScore(meal.breakdown, w);
  const helping = parts.filter((p) => p.contribution > 0.05).map((p) => p.need);
  return {
    id: meal.id, text: meal.text, cuisine: meal.cuisine, diet: meal.diet, score: total,
    helps: helping.slice(0, 2).map((n) => NEED_LABEL[n]),
    facts: factsFor(meal.nutrients, meal.breakdown, helping.length ? helping : Object.keys(w)).good.slice(0, 2),
  };
}

/** Interleaves Indian and Western meals so a "both" preference really shows both. */
function interleave(ranked) {
  const indian = ranked.filter((m) => m.cuisine.includes('indian') && !m.cuisine.includes('western'));
  const western = ranked.filter((m) => m.cuisine.includes('western') && !m.cuisine.includes('indian'));
  const any = ranked.filter((m) => m.cuisine.length > 1);
  const out = [];
  while (indian.length || western.length || any.length) {
    for (const list of [indian, western, any]) if (list.length) out.push(list.shift());
  }
  return out;
}

/**
 * A rotating plan: each day gets a main option and an alternative per meal, chosen from the best-scoring meals
 * that fit the preferences. The rotation shifts every calendar week (seeded by profile and week), so the plan
 * changes over time but stays the same within a week.
 */
export function weekPlan(needs, prefs = DEFAULT_PREFERENCES, { start = new Date(), days = 7, seed = '' } = {}) {
  const w = activeWeights(needs);
  const week = isoWeek(start);
  return Array.from({ length: days }, (_, d) => {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + d);
    const label = d === 0 ? 'Today' : d === 1 ? 'Tomorrow' : `${WEEKDAY[date.getDay()]} ${date.getDate()} ${MONTH[date.getMonth()]}`;
    const meals = MEAL_SLOTS.map((slot) => {
      const ranked = MEAL_INFO
        .filter((m) => m.slot === slot && fits(prefs, m) && !m.foods.some((id) => prefs.hidden.includes(id)))
        .map((m) => ({ ...mealView(m, w), cuisine: m.cuisine }))
        .sort((a, b) => b.score - a.score);
      const pool = (prefs.cuisine === 'both' ? interleave(ranked) : ranked).slice(0, 10);
      if (!pool.length) return { slot, main: null, alt: null };
      const offset = hash(`${seed}|${slot}|${week}`) % pool.length;
      const main = pool[(offset + d) % pool.length];
      const alt = pool.length > 1 ? pool[(offset + d + Math.ceil(pool.length / 2)) % pool.length] : null;
      return { slot, main, alt: alt && alt.id !== main.id ? alt : null };
    });
    return { date: date.toISOString().slice(0, 10), label, meals };
  });
}

/** Plate proportions (percent of the plate) driven by this profile's needs and preferences. */
export function mealPlate(needs, prefs = DEFAULT_PREFERENCES) {
  const w = needs.weights;
  const sugarOrTg = (w.glycemic || 0) >= 2 || (w.triglycerides || 0) >= 2;
  const parts = sugarOrTg ? { veg: 50, protein: 25, carbs: 20, fats: 5 } : { veg: 45, protein: 25, carbs: 25, fats: 5 };
  const indian = prefs.cuisine !== 'western';
  const western = prefs.cuisine !== 'indian';
  const pick = (i, we) => [indian && i, western && we].filter(Boolean);

  const protein = [];
  protein.push(indian ? 'Dal, chana, rajma' : 'Lentils, beans, chickpeas');
  if (prefs.avoid.includes('soy') === false) protein.push('tofu');
  if (allowsDiet(prefs, 'vegetarian') && !prefs.avoid.includes('dairy')) protein.push(indian ? 'paneer, curd' : 'Greek yogurt, cottage cheese');
  if (allowsDiet(prefs, 'egg') && !prefs.avoid.includes('egg')) protein.push('eggs');
  if (allowsDiet(prefs, 'fish') && !prefs.avoid.includes('fish')) protein.push('fish');
  if (allowsDiet(prefs, 'meat')) protein.push('chicken');

  const ex = {
    veg: pick('Bhindi, gobhi, beans, cabbage', 'Broccoli, peppers, salad greens'),
    protein: [protein.join(', ')],
    carbs: pick(prefs.avoid.includes('gluten') ? 'Millet or jowar roti, brown rice' : 'Millet or whole-wheat roti', 'Brown rice, quinoa, oats'),
    fats: pick('Mustard, groundnut or canola oil, measured', 'Olive or canola oil, nuts, seeds, avocado'),
  };
  const notes = [];
  if (sugarOrTg) notes.push('Blood sugar and/or triglycerides are above range, so carbs are kept to about a fifth of the plate (½ cup cooked grains or 1 roti) and vegetables fill half.');
  if (w.ldl) notes.push(indian ? 'Cook with measured plant oils instead of ghee or butter to help LDL.' : 'Cook with measured plant oils instead of butter to help LDL.');
  if (w.iron) {
    ex.veg = pick('Palak, methi, chaulai greens', 'Spinach, kale, broccoli');
    notes.push('Add a vitamin C food (lemon, guava, orange, tomato, peppers) to the plate to help absorb iron. Keep tea and coffee away from the meal.');
  }
  const veg = isVegetarianDiet(prefs.diet);
  if (w.vitd) notes.push(veg ? 'Include a vitamin D food most days: fortified milk or soy milk, or UV-exposed mushrooms. Food alone rarely fixes a low level, so ask about a supplement.' : 'Include a vitamin D food most days: fatty fish, eggs, or fortified milk.');
  if (w.b12) notes.push(prefs.diet === 'vegan' ? 'Vegan diets need a reliable B12 source: fortified soy milk or cereal, or a supplement your clinician suggests.' : veg ? 'Include a B12 food daily: milk, curd, paneer, or fortified foods.' : 'Include a B12 food: eggs, dairy, fish, or fortified foods.');
  if (w.hdl && !w.ldl) notes.push('Include healthy fats (nuts, seeds, olive oil) at most meals to support HDL.');
  return { parts, examples: ex, notes };
}
