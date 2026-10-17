// Per-profile food preferences: diet, cuisine, allergies and foods the person has hidden.
// Stored in localStorage under one key, as { [profileId]: preferences }.

export const PREFERENCES_KEY = 'health-insights.preferences.v1';

export const DIETS = [
  { id: 'all', label: 'Everything', allows: ['vegan', 'vegetarian', 'egg', 'fish', 'meat'] },
  { id: 'pescatarian', label: 'Pescatarian', allows: ['vegan', 'vegetarian', 'egg', 'fish'] },
  { id: 'eggetarian', label: 'Eggetarian', allows: ['vegan', 'vegetarian', 'egg'] },
  { id: 'vegetarian', label: 'Vegetarian', allows: ['vegan', 'vegetarian'] },
  { id: 'vegan', label: 'Vegan', allows: ['vegan'] },
];

export const CUISINES = [
  { id: 'both', label: 'Indian and Western' },
  { id: 'indian', label: 'Indian' },
  { id: 'western', label: 'Western' },
];

export const ALLERGENS = [
  { id: 'dairy', label: 'Dairy' }, { id: 'egg', label: 'Egg' }, { id: 'gluten', label: 'Gluten' },
  { id: 'peanut', label: 'Peanut' }, { id: 'treenut', label: 'Tree nuts' }, { id: 'soy', label: 'Soy' },
  { id: 'fish', label: 'Fish' }, { id: 'shellfish', label: 'Shellfish' }, { id: 'sesame', label: 'Sesame' },
];

export const DEFAULT_PREFERENCES = Object.freeze({ diet: 'all', cuisine: 'both', avoid: [], hidden: [] });

const DIET_IDS = new Set(DIETS.map((d) => d.id));
const CUISINE_IDS = new Set(CUISINES.map((c) => c.id));
const ALLERGEN_IDS = new Set(ALLERGENS.map((a) => a.id));
const DIET_ORDER = ['vegan', 'vegetarian', 'egg', 'fish', 'meat'];

/** Fills in defaults and drops unknown values, so stored data from older versions is always usable. */
export function normalizePreferences(p = {}) {
  return {
    diet: DIET_IDS.has(p.diet) ? p.diet : DEFAULT_PREFERENCES.diet,
    cuisine: CUISINE_IDS.has(p.cuisine) ? p.cuisine : DEFAULT_PREFERENCES.cuisine,
    avoid: Array.isArray(p.avoid) ? [...new Set(p.avoid.filter((a) => ALLERGEN_IDS.has(a)))] : [],
    hidden: Array.isArray(p.hidden) ? [...new Set(p.hidden.filter((h) => typeof h === 'string'))] : [],
  };
}

export const isVegetarianDiet = (diet) => diet === 'vegetarian' || diet === 'vegan';

/** The strictest diet a list of foods needs: a meal with chicken is 'meat', with curd only 'vegetarian'. */
export function dietOf(foods) {
  return foods.reduce((acc, f) => (DIET_ORDER.indexOf(f.diet) > DIET_ORDER.indexOf(acc) ? f.diet : acc), 'vegan');
}

export function allowsDiet(prefs, diet) {
  return (DIETS.find((d) => d.id === prefs.diet) || DIETS[0]).allows.includes(diet);
}

export function allowsCuisine(prefs, cuisines) {
  return prefs.cuisine === 'both' || cuisines.includes(prefs.cuisine);
}

/** Whether a food or meal fits these preferences. `item` has diet, cuisine and allergens. */
export function fits(prefs, item) {
  return allowsDiet(prefs, item.diet)
    && allowsCuisine(prefs, item.cuisine)
    && !item.allergens.some((a) => prefs.avoid.includes(a))
    && !prefs.hidden.includes(item.id);
}

function getStore() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

function readAll() {
  try {
    const all = JSON.parse(getStore()?.getItem(PREFERENCES_KEY) || '{}');
    return all && typeof all === 'object' && !Array.isArray(all) ? all : {};
  } catch {
    return {};
  }
}

export function getPreferences(profileId) {
  return normalizePreferences(readAll()[profileId]);
}

/** Saves preferences for one profile. Returns false when the browser cannot store them. */
export function savePreferences(profileId, prefs) {
  const store = getStore();
  if (!store) return false;
  try {
    store.setItem(PREFERENCES_KEY, JSON.stringify({ ...readAll(), [profileId]: normalizePreferences(prefs) }));
    return true;
  } catch {
    return false;
  }
}

export function deletePreferences(profileId) {
  const store = getStore();
  if (!store) return;
  const all = readAll();
  delete all[profileId];
  try {
    store.setItem(PREFERENCES_KEY, JSON.stringify(all));
  } catch {
    // Nothing else to clean up; stale preferences for a deleted profile are harmless.
  }
}
