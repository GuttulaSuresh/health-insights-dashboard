import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizePreferences, getPreferences, savePreferences, deletePreferences, dietOf, fits, DEFAULT_PREFERENCES } from '../src/lib/preferences.js';

function memoryStorage() {
  const data = new Map();
  return { getItem: (k) => (data.has(k) ? data.get(k) : null), setItem: (k, v) => data.set(k, String(v)), removeItem: (k) => data.delete(k) };
}

test('unknown or missing values fall back to defaults', () => {
  assert.deepEqual(normalizePreferences(), { ...DEFAULT_PREFERENCES });
  assert.deepEqual(normalizePreferences({ diet: 'keto', cuisine: 'thai', avoid: ['soy', 'soy', 'chocolate'], hidden: [1, 'oats'] }), { diet: 'all', cuisine: 'both', avoid: ['soy'], hidden: ['oats'] });
});

test('preferences are stored per profile', () => {
  globalThis.localStorage = memoryStorage();
  assert.equal(savePreferences('a', { diet: 'vegetarian', cuisine: 'indian' }), true);
  savePreferences('b', { diet: 'vegan' });
  assert.equal(getPreferences('a').diet, 'vegetarian');
  assert.equal(getPreferences('a').cuisine, 'indian');
  assert.equal(getPreferences('b').diet, 'vegan');
  deletePreferences('a');
  assert.equal(getPreferences('a').diet, 'all');
  assert.equal(getPreferences('b').diet, 'vegan');
});

test('preferences still work without browser storage', () => {
  globalThis.localStorage = undefined;
  assert.equal(savePreferences('a', { diet: 'vegan' }), false);
  assert.deepEqual(getPreferences('a'), { ...DEFAULT_PREFERENCES });
});

test('a meal takes the strictest diet of its foods', () => {
  assert.equal(dietOf([{ diet: 'vegan' }, { diet: 'vegetarian' }]), 'vegetarian');
  assert.equal(dietOf([{ diet: 'vegan' }, { diet: 'fish' }, { diet: 'egg' }]), 'fish');
  const item = { id: 'x', diet: 'egg', cuisine: ['western'], allergens: ['egg'] };
  assert.equal(fits(normalizePreferences({ diet: 'eggetarian' }), item), true);
  assert.equal(fits(normalizePreferences({ diet: 'vegetarian' }), item), false);
  assert.equal(fits(normalizePreferences({ cuisine: 'indian' }), item), false);
  assert.equal(fits(normalizePreferences({ avoid: ['egg'] }), item), false);
});
