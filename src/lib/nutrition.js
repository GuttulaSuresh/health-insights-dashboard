// Food recommendation engine. Input: one profile's `needs` (from its own findings). Output: ranked foods,
// eat-more sections, limits, swaps, daily plan and plate. Nothing here can see another profile.
import { FOODS, LIMITS, SWAPS, MEALS, NEED_LABEL } from '../content/foods.js';
import { fmt } from './insights.js';

const score = (supports, cautions, w) => {
  let s = 0;
  for (const [n, k] of Object.entries(supports || {})) s += (w[n] || 0) * k;
  for (const n of cautions || []) s -= (w[n] || 0) * 2;
  return s;
};

function evidenceText(need, evidence) {
  const recs = evidence[need] || [];
  const uniq = [...new Map(recs.map((r) => [r.marker_id, r])).values()];
  return uniq.slice(0, 3).map(fmt);
}

function foodView(f, needs) {
  const w = needs.weights;
  const active = Object.entries(f.supports).filter(([n, k]) => k > 0 && w[n]).sort((a, b) => w[b[0]] * b[1] - w[a[0]] * a[1]);
  return {
    ...f,
    score: score(f.supports, f.caution, w),
    supportsLabs: active.flatMap(([n]) => evidenceText(n, needs.evidence)).filter((x, i, a) => a.indexOf(x) === i).slice(0, 4),
    supportsAreas: active.map(([n]) => NEED_LABEL[n]),
    reason: active.map(([n]) => f.why[n]).filter(Boolean).slice(0, 2).join(' '),
  };
}

export function topFoods(needs, n = 10, opts = {}) {
  const ranked = FOODS.filter((f) => !(opts.vegetarian && f.nonVeg)).map((f) => foodView(f, needs)).filter((f) => f.score > 0).sort((a, b) => b.score - a.score);
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

export const EAT_MORE_SECTIONS = [
  { name: 'Vegetables', icon: '🥬' }, { name: 'Fruits', icon: '🍓' }, { name: 'Whole grains', icon: '🌾' },
  { name: 'Protein', icon: '🫘' }, { name: 'Healthy fats', icon: '🫒' }, { name: 'Nuts and seeds', icon: '🥜' },
  { name: 'Fermented foods', icon: '🥣' }, { name: 'Vitamin/mineral-rich foods', icon: '💊' },
];

export function eatMore(needs, opts = {}) {
  return EAT_MORE_SECTIONS.map((s) => {
    const items = FOODS.filter((f) => f.section === s.name && !(opts.vegetarian && f.nonVeg)).map((f) => foodView(f, needs)).sort((a, b) => b.score - a.score);
    const relevant = items.filter((f) => f.score > 0).slice(0, 3);
    return {
      ...s,
      items: relevant.length ? relevant : items.slice(0, 1).map((f) => ({ ...f, reason: 'A generally healthy choice; not tied to a specific result for this profile.' })),
      general: !relevant.length,
    };
  });
}

export function foodsToLimit(needs) {
  const w = needs.weights;
  return LIMITS.map((l) => ({ ...l, active: l.needs.filter((n) => w[n]) }))
    .filter((l) => l.active.length)
    .map((l) => ({ ...l, s: l.active.reduce((s, n) => s + w[n], 0), labs: l.active.flatMap((n) => evidenceText(n, needs.evidence)).filter((x, i, a) => a.indexOf(x) === i).slice(0, 3) }))
    .sort((a, b) => b.s - a.s);
}

export function foodSwaps(needs) {
  return SWAPS.filter((s) => s.needs.some((n) => needs.weights[n]));
}

/** 2–3 options per meal slot, mixing Indian and Western options where possible. */
export function dailyPlan(needs, opts = {}) {
  const w = needs.weights;
  return Object.entries(MEALS).map(([slot, options]) => {
    const ranked = options.filter((o) => !(opts.vegetarian && o.nonVeg)).map((o) => ({ ...o, score: score(o.supports, o.caution, w) })).sort((a, b) => b.score - a.score);
    const want = slot === 'Before Bed' ? 1 : 3;
    const picked = [];
    // Make sure both cuisines appear when available.
    for (const c of ['Indian', 'Western']) {
      const best = ranked.find((o) => o.cuisine === c && !picked.includes(o));
      if (best && picked.length < want) picked.push(best);
    }
    for (const o of ranked) if (picked.length < want && !picked.includes(o)) picked.push(o);
    picked.sort((a, b) => b.score - a.score);
    const reasons = (o) => Object.entries(o.supports).filter(([n]) => w[n]).sort((a, b) => w[b[0]] * b[1] - w[a[0]] * a[1]).map(([n]) => NEED_LABEL[n]).slice(0, 2);
    return { slot, optional: slot === 'Before Bed', options: picked.map((o) => ({ ...o, helps: reasons(o) })) };
  });
}

/** Plate proportions (percent of the plate) driven by this profile's needs. */
export function mealPlate(needs) {
  const w = needs.weights;
  const sugarOrTg = (w.glycemic || 0) >= 2 || (w.triglycerides || 0) >= 2;
  const parts = sugarOrTg
    ? { veg: 50, protein: 25, carbs: 20, fats: 5 }
    : { veg: 45, protein: 25, carbs: 25, fats: 5 };
  const ex = {
    veg: ['Bhindi, cauliflower, beans, cabbage', 'Broccoli, peppers, salad greens'],
    protein: ['Dal, chana, rajma', 'Eggs, fish, chicken, tofu or paneer'],
    carbs: ['Millet or whole-wheat roti', 'Brown rice, quinoa, oats'],
    fats: ['Olive, canola or peanut oil', 'Nuts, seeds, avocado'],
  };
  const notes = [];
  if (sugarOrTg) notes.push('Blood sugar and/or triglycerides are above range, so carbs are kept to about a fifth of the plate (½ cup cooked grains or 1 roti) and vegetables fill half.');
  if (w.ldl) notes.push('Cook with measured plant oils instead of butter or ghee to help LDL.');
  if (w.iron) { ex.veg[0] = 'Palak, methi, amaranth greens'; ex.protein[0] = 'Dal, chana, rajma (iron-rich)'; notes.push('Add a vitamin C food (lemon, guava, tomato, peppers) to the plate to help absorb iron. Keep tea and coffee away from the meal.'); }
  if (w.vitd) notes.push('Include a vitamin D food most days: fatty fish, eggs, or fortified milk/yogurt.');
  if (w.b12) notes.push('Include a B12 food: eggs, dairy, fish, or fortified foods if vegetarian.');
  if (w.hdl && !w.ldl) notes.push('Include healthy fats (nuts, seeds, olive oil) at most meals to support HDL.');
  if (w.triglycerides) ex.protein[1] = 'Fatty fish twice a week; eggs, chicken or tofu';
  return { parts, examples: ex, notes };
}
