import test from 'node:test';
import assert from 'node:assert/strict';
import { buildProfileModel } from '../src/lib/model.js';
import { buildContext } from '../src/lib/localAi.js';
import { answer } from '../src/lib/qa.js';

// Synthetic test fixtures only (not real data).
const rec = (o) => ({ profile_id: 'p1', profile_name: 'Test', unit: 'mg/dL', source: 'Test fixture', ...o });
const files = (rows) => [{ file: 'x.json', content: rows }];

test('changes since the last report are classified', () => {
  const m = buildProfileModel({ id: 'p1', name: 'Test' }, files([
    rec({ test_name: 'LDL', value: 160, reference_high: 100, collection_date: '2026-01-10' }),
    rec({ test_name: 'LDL', value: 130, reference_high: 100, collection_date: '2026-06-10' }),
    rec({ test_name: 'Triglycerides', value: 160, reference_high: 150, collection_date: '2026-01-10' }),
    rec({ test_name: 'Triglycerides', value: 120, reference_high: 150, collection_date: '2026-06-10' }),
    rec({ test_name: 'HbA1c', unit: '%', value: 5.6, reference_high: 5.7, collection_date: '2026-01-10' }),
    rec({ test_name: 'HbA1c', unit: '%', value: 5.9, reference_high: 5.7, collection_date: '2026-06-10' }),
    rec({ test_name: 'HDL', value: 50, reference_low: 40, collection_date: '2026-06-10' }),
  ]));
  const kind = Object.fromEntries(m.progress.map((p) => [p.marker_id, p.kind]));
  assert.equal(kind.ldl, 'improving');
  assert.equal(kind.triglycerides, 'back_in_range');
  assert.equal(kind.hba1c, 'new_out');
  assert.equal(kind.hdl, undefined, 'a single result has nothing to compare');
  assert.match(m.progress.find((p) => p.marker_id === 'ldl').text, /LDL fell from 160 to 130 mg\/dL since 10 Jan 2026 \(−19%\)/);
  assert.equal(m.progress[0].kind, 'new_out', 'what needs attention is listed first');
  assert.equal(m.foodRecommendations.needs.trends.ldl, 'improving');
});

test('a result that is getting worse gets more weight in food suggestions', () => {
  const rows = (second) => files([
    rec({ test_name: 'LDL', value: 120, reference_high: 100, collection_date: '2026-01-10' }),
    rec({ test_name: 'LDL', value: second, reference_high: 100, collection_date: '2026-06-10' }),
  ]);
  const better = buildProfileModel({ id: 'p1', name: 'Test' }, rows(110));
  const worse = buildProfileModel({ id: 'p1', name: 'Test' }, rows(130));
  assert.ok(worse.foodRecommendations.needs.weights.ldl > better.foodRecommendations.needs.weights.ldl);
  assert.equal(worse.foodRecommendations.needs.trends.ldl, 'worsening');
});

test('Q&A answers "what changed" from the history', () => {
  const m = buildProfileModel({ id: 'p1', name: 'Test' }, files([
    rec({ test_name: 'LDL', value: 160, reference_high: 100, collection_date: '2026-01-10' }),
    rec({ test_name: 'LDL', value: 130, reference_high: 100, collection_date: '2026-06-10' }),
  ]));
  const a = answer('What changed since my last report?', m);
  assert.match(JSON.stringify(a.blocks), /LDL fell from 160 to 130/);
});

test('the on-device AI context holds only this profile and its preferences', () => {
  const m = buildProfileModel({ id: 'p1', name: 'Test' }, files([
    rec({ test_name: 'LDL', value: 130, reference_high: 100, collection_date: '2026-06-10' }),
    rec({ profile_id: 'p2', test_name: 'HDL', value: 30, reference_low: 40, collection_date: '2026-06-10' }),
  ]), { diet: 'vegetarian', avoid: ['peanut'] });
  const ctx = buildContext(m);
  assert.match(ctx, /LDL: 130 mg\/dL, HIGH/);
  assert.doesNotMatch(ctx, /HDL/);
  assert.match(ctx, /diet vegetarian/);
  assert.match(ctx, /avoids peanut/);
});
