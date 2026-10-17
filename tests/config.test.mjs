import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveDataDir } from '../src/lib/config.js';
import { validateManifest } from '../src/lib/manifest.js';

const publicDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'public');

test('data directory is optional and normalized', () => {
  assert.equal(resolveDataDir(undefined), null);
  assert.equal(resolveDataDir(''), null);
  assert.equal(resolveDataDir('/local-data/'), 'local-data');
  assert.equal(resolveDataDir('nested\\folder'), 'nested/folder');
});

test('data directory cannot escape public/', () => {
  assert.throws(() => resolveDataDir('../secrets'), /inside public/);
  assert.throws(() => resolveDataDir('data/../../x'), /inside public/);
});

test('manifest validation reports the problem clearly', () => {
  assert.throws(() => validateManifest({}), /"profiles" array/);
  assert.throws(() => validateManifest({ profiles: [] }), /no profiles/);
  assert.throws(() => validateManifest({ profiles: [{ id: 'Jane Doe', name: 'Jane' }] }), /lowercase/);
  assert.throws(() => validateManifest({ profiles: [{ id: 'a', name: 'A' }, { id: 'a', name: 'B' }] }), /Duplicate/);
  assert.throws(() => validateManifest({ profiles: [{ id: 'unassigned', name: 'X' }] }), /reserved/);
  assert.throws(() => validateManifest({ profiles: [{ id: 'a', name: 'A', files: ['../x.json'] }] }), /invalid path/);
  const ok = validateManifest({ profiles: [{ id: 'a', name: ' A ' }] });
  assert.deepEqual(ok.profiles[0], { id: 'a', name: 'A', match: [], files: [] });
});

test('bundled sample manifest is valid and every listed file exists', () => {
  const manifest = validateManifest(JSON.parse(fs.readFileSync(path.join(publicDir, 'sample-data', 'profiles.json'), 'utf8')));
  assert.ok(manifest.profiles.length >= 1);
  for (const p of manifest.profiles) {
    for (const f of p.files) assert.ok(fs.existsSync(path.join(publicDir, 'sample-data', ...f.split('/'))), `${f} is missing`);
  }
});
