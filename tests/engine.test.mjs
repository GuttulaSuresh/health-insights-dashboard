import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveMarker, computeStatus, normalizeProfileData, parseCSV } from '../src/lib/normalize.js';
import { buildProfileModel } from '../src/lib/model.js';
import { answer } from '../src/lib/qa.js';

// Synthetic test fixtures only (not real data).
const rec = (o) => ({ profile_id: 'p1', profile_name: 'Test', unit: 'mg/dL', source: 'Test fixture', collection_date: '2026-01-01', ...o });

test('test-name aliases map to the same marker', () => {
  for (const [a, b] of [['HDL', 'HDL cholesterol'], ['CO2', 'CO2/bicarbonate'], ['CO2 (bicarbonate)', 'Bicarbonate'], ['LDL (calc, Martin-Hopkins)', 'LDL cholesterol (Martin-Hopkins calc)'], ['Chol/HDL ratio', 'Cholesterol/HDL ratio'], ['Vitamin D, 25-OH total', '25-OH Vitamin D']]) {
    assert.equal(resolveMarker(a)?.id, resolveMarker(b)?.id, `${a} vs ${b}`);
    assert.ok(resolveMarker(a));
  }
  assert.notEqual(resolveMarker('HDL').id, resolveMarker('Non-HDL cholesterol').id);
});

test('status comes from the lab range, including one-sided limits', () => {
  assert.equal(computeStatus({ value: 5.7, hi: 5.7, rule: 'lt' }), 'HIGH');
  assert.equal(computeStatus({ value: 5.6, hi: 5.7, rule: 'lt' }), 'IN RANGE');
  assert.equal(computeStatus({ value: 41, lo: 50, rule: 'ge' }), 'LOW');
  assert.equal(computeStatus({ value: 79.2, lo: 81.4, hi: 101.7, rule: 'range' }), 'LOW');
  assert.equal(computeStatus({ value: null, fileStatus: 'NOT REPORTED' }), 'NOT REPORTED');
  assert.equal(computeStatus({ value: null }), 'NOT AVAILABLE');
  assert.equal(computeStatus({ value: 'NOT DETECTED', expected: 'NOT DETECTED' }), 'IN RANGE');
});

test('records from another profile are quarantined, never shown', () => {
  const d = normalizeProfileData({ id: 'p1', name: 'Test' }, [{ file: 'x.json', content: [rec({ test_name: 'HDL', value: 50, reference_low: 40 }), rec({ profile_id: 'p2', test_name: 'LDL', value: 90, reference_high: 100 }), rec({ profile_id: null, test_name: 'TSH', value: 1 })] }]);
  assert.equal(d.records.length, 1);
  assert.equal(d.quarantined.length, 2);
});

test('duplicates are merged and trends use real history only', () => {
  const content = [
    rec({ test_name: 'HbA1c', unit: '%', value: 6.1, reference_high: 5.7, collection_date: '2025-06-01' }),
    rec({ test_name: 'Hemoglobin A1c', unit: '%', value: 5.8, reference_high: 5.7, collection_date: '2026-01-01' }),
    rec({ test_name: 'HbA1c', unit: '%', value: 5.8, reference_high: 5.7, collection_date: '2026-01-01' }),
    rec({ test_name: 'Vitamin D', unit: 'ng/mL', value: 25, reference_low: 30, reference_high: 100 }),
  ];
  const d = normalizeProfileData({ id: 'p1', name: 'Test' }, [{ file: 'x.json', content }]);
  const a1c = d.records.find((r) => r.marker_id === 'hba1c');
  assert.equal(d.duplicates.length, 1);
  assert.equal(a1c.previous_value, 6.1);
  assert.equal(a1c.trend, '↓ Decreasing');
  assert.equal(a1c.quality, 'improving');
  assert.equal(a1c.history.length, 2);
  assert.equal(d.records.find((r) => r.marker_id === 'vitamin_d').trend, 'New');
});

test('CSV files parse the same as JSON', () => {
  const rows = parseCSV('profile_id,test_name,value,unit,reference_low,reference_high\np1,"Iron, total",67,mcg/dL,50,180\n');
  assert.equal(rows[0].test_name, 'Iron, total');
  assert.equal(resolveMarker(rows[0].test_name).id, 'iron');
});

test('mild single abnormality is not exaggerated; HbA1c >= 6.5 is high priority', () => {
  const m = buildProfileModel({ id: 'p1', name: 'Test' }, [{ file: 'x.json', content: [rec({ test_name: 'Iron saturation', unit: '%', value: 19, reference_low: 20, reference_high: 48 }), rec({ test_name: 'HbA1c', unit: '%', value: 6.8, reference_high: 5.7 })] }]);
  const sev = Object.fromEntries(m.labRecords.map((r) => [r.marker_id, r.severity]));
  assert.equal(sev.iron_saturation, 'watch');
  assert.equal(sev.hba1c, 'priority');
});

test('Q&A says "not available" for tests the profile does not have', () => {
  const m = buildProfileModel({ id: 'p1', name: 'Test' }, [{ file: 'x.json', content: [rec({ test_name: 'HDL', value: 50, reference_low: 40 })] }]);
  const a = answer('Why is my B12 low?', m);
  assert.match(a.blocks[0].text, /not in Test's uploaded results/);
});
