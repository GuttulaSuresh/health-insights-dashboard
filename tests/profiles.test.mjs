import test from 'node:test';
import assert from 'node:assert/strict';
import { displayNameFromReport, makeProfileId, createProfile } from '../src/lib/profiles.js';
import { suggestProfile } from '../src/lib/reportParser.js';

test('names printed on reports become readable profile names', () => {
  assert.equal(displayNameFromReport('DOE, JOHN'), 'John Doe');
  assert.equal(displayNameFromReport('ROE,  RICHARD  A'), 'Richard A Roe');
  assert.equal(displayNameFromReport("o'neil, mary-kate"), "Mary-Kate O'Neil");
  assert.equal(displayNameFromReport('Jane Doe'), 'Jane Doe');
  assert.equal(displayNameFromReport(''), '');
  assert.equal(displayNameFromReport(null), '');
});

test('profile ids are unique, safe and never collide with sample or reserved ids', () => {
  assert.equal(makeProfileId('John Doe'), 'john-doe');
  assert.equal(makeProfileId('John Doe', ['john-doe']), 'john-doe-2');
  assert.equal(makeProfileId('John Doe', ['john-doe', 'john-doe-2']), 'john-doe-3');
  assert.equal(makeProfileId('José Núñez'), 'jose-nunez');
  assert.equal(makeProfileId('Sample John'), 'p-sample-john');
  assert.equal(makeProfileId('Unassigned'), 'p-unassigned');
  assert.equal(makeProfileId('!!!'), 'person');
});

test('a profile created from a report is suggested for that person\'s next report', () => {
  const p = createProfile(displayNameFromReport('DOE, JOHN'), { match: ['DOE, JOHN', null] });
  assert.deepEqual(p.match, ['DOE, JOHN']);
  assert.equal(suggestProfile('DOE, JOHN', [p]), p.id);
  assert.equal(suggestProfile('ROE, RICHARD', [p]), null);
  assert.throws(() => createProfile('  '), /needs a name/);
});
