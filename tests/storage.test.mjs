import test from 'node:test';
import assert from 'node:assert/strict';
import { listReports, saveReport, deleteReport, listProfiles, saveProfile, deleteProfile, getShowSample, setShowSample, STORAGE_KEY } from '../src/lib/storage.js';

function memoryStorage() {
  const data = new Map();
  return {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => data.set(k, String(v)),
    removeItem: (k) => data.delete(k),
  };
}

test('reports are saved, replaced by id and deleted', async () => {
  globalThis.localStorage = memoryStorage();
  await saveReport({ id: 'r1', profile_id: 'unassigned', records: [] });
  await saveReport({ id: 'r2', profile_id: 'jane-doe', records: [] });
  await saveReport({ id: 'r1', profile_id: 'john-doe', records: [] });
  const list = await listReports();
  assert.equal(list.length, 2);
  assert.equal(list.find((r) => r.id === 'r1').profile_id, 'john-doe');
  await deleteReport('r2');
  assert.deepEqual((await listReports()).map((r) => r.id), ['r1']);
});

test('corrupt stored data is ignored instead of crashing', async () => {
  globalThis.localStorage = memoryStorage();
  globalThis.localStorage.setItem(STORAGE_KEY, '{not json');
  assert.deepEqual(await listReports(), []);
  globalThis.localStorage.setItem(STORAGE_KEY, '{"id":"x"}');
  assert.deepEqual(await listReports(), []);
});

test('saving without browser storage fails with a readable error', async () => {
  delete globalThis.localStorage;
  assert.deepEqual(await listReports(), []);
  await assert.rejects(saveReport({ id: 'r1' }), /storage is not available/);
});

test('deleting a profile also deletes its reports, and only its reports', async () => {
  globalThis.localStorage = memoryStorage();
  await saveProfile({ id: 'john-doe', name: 'John Doe', match: [] });
  await saveProfile({ id: 'jane-doe', name: 'Jane Doe', match: [] });
  await saveReport({ id: 'r1', profile_id: 'john-doe', records: [] });
  await saveReport({ id: 'r2', profile_id: 'jane-doe', records: [] });
  await saveReport({ id: 'r3', profile_id: 'unassigned', records: [] });
  await deleteProfile('john-doe');
  assert.deepEqual((await listProfiles()).map((p) => p.id), ['jane-doe']);
  assert.deepEqual((await listReports()).map((r) => r.id).sort(), ['r2', 'r3']);
});

test('sample data is hidden unless the viewer turns it on', () => {
  globalThis.localStorage = memoryStorage();
  assert.equal(getShowSample(), false);
  setShowSample(true);
  assert.equal(getShowSample(), true);
  delete globalThis.localStorage;
  assert.equal(getShowSample(), false);
  assert.doesNotThrow(() => setShowSample(true));
});
