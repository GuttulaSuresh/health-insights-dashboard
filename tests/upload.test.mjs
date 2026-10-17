import test from 'node:test';
import assert from 'node:assert/strict';
import { parseRange, parseResultLine, parseReportLines, suggestProfile, toLabRecords } from '../src/lib/reportParser.js';
import { uploadedFilesFor } from '../src/lib/loadData.js';
import { normalizeProfileData } from '../src/lib/normalize.js';

test('reference ranges as printed by labs', () => {
  assert.deepEqual(parseRange('<200'), { low: null, high: 200, rule: 'lt' });
  assert.deepEqual(parseRange('> OR = 40'), { low: 40, high: null, rule: 'ge' });
  assert.deepEqual(parseRange('65-99'), { low: 65, high: 99, rule: 'range' });
  assert.equal(parseRange('see note'), null);
});

test('tabular result rows with status column, flag and lab code', () => {
  const r = parseResultLine('F    TRIGLYCERIDES    243    H    <150 (mg/dL)    DAL');
  assert.equal(r.marker_id, 'triglycerides'); assert.equal(r.value, 243); assert.equal(r.lab_flag, 'H');
  assert.equal(r.reference_high, 150); assert.equal(r.unit, 'mg/dL');
  const t = parseResultLine('F    TSH W/REFLEX TO FT4    1.18 (mIU/L)    DAL');
  assert.equal(t.value, 1.18); assert.equal(t.reference_rule, null);
  assert.equal(parseResultLine('This is a comment line about fasting.'), null);
});

test('range from a lab comment below the row', () => {
  const out = parseReportLines(['DOE, JANE DOB: 01/01/1990', 'Collected: 10/09/2026', 'LIPID PANEL (REFL) (15434)',
    'F    LDL-CHOLESTEROL    95 (mg/dL (calc))    DAL', 'Reference range: <100']);
  assert.equal(out.patientName, 'DOE, JANE'); assert.equal(out.collectionDate, '2026-10-09');
  assert.equal(out.records[0].reference_high, 100); assert.equal(out.records[0].range_source, 'report note');
});

const profiles = [{ id: 'jane-doe', name: 'Jane Doe', match: ['DOE, JANE'] }, { id: 'john-doe', name: 'John Doe', match: ['DOE, JOHN'] }];
test('owner is suggested only on a clear name match', () => {
  assert.equal(suggestProfile('DOE, JANE', profiles), 'jane-doe');
  assert.equal(suggestProfile('DOE, JOHN', profiles), 'john-doe');
  assert.equal(suggestProfile('ROE, RICHARD', profiles), null);
  assert.equal(suggestProfile(null, profiles), null);
});

test('uploaded reports only reach their own profile; unassigned reaches no one', () => {
  const rows = [{ include: true, test_name: 'HDL CHOLESTEROL', value: 41, unit: 'mg/dL', reference_low: 50, reference_rule: 'ge' }];
  const rec = (p) => toLabRecords(rows, { profile: p, collectionDate: '2026-12-01', source: 'Uploaded Lab Report (PDF)' });
  const reports = [
    { id: 'a', profile_id: 'jane-doe', file_name: 'jane.pdf', records: rec(profiles[0]) },
    { id: 'b', profile_id: 'unassigned', file_name: 'x.pdf', records: rec({ id: 'unassigned', name: 'Unassigned' }) },
  ];
  assert.equal(uploadedFilesFor('jane-doe', reports).length, 1);
  assert.equal(uploadedFilesFor('john-doe', reports).length, 0);
  const d = normalizeProfileData({ id: 'john-doe', name: 'John Doe' }, [{ file: 'x', content: reports[0].records }]);
  assert.equal(d.records.length, 0); assert.equal(d.quarantined.length, 1);
});
