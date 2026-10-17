// End-to-end checks on a data folder: every record is accounted for, lab ranges are preserved,
// status matches the lab flags, and profiles never mix.
//
// Usage: npm run verify [-- <folder under public/>]   (defaults to VITE_DATA_DIR, then "data")
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildProfileModel } from '../src/lib/model.js';
import { answer } from '../src/lib/qa.js';
import * as foods from '../src/content/foods.js';
import { extractRawRecords } from '../src/lib/normalize.js';
import { resolveDataDir } from '../src/lib/config.js';
import { validateManifest } from '../src/lib/manifest.js';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = resolveDataDir(process.argv[2] || process.env.VITE_DATA_DIR);
const root = path.join(projectRoot, 'public', ...dataDir.split('/'));

let failures = 0;
const check = (ok, msg) => {
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${msg}`);
  if (!ok) failures++;
};

function readManifest() {
  const file = path.join(root, 'profiles.json');
  if (!fs.existsSync(file)) {
    console.error(`No profiles.json found in public/${dataDir}/`);
    process.exit(1);
  }
  return validateManifest(JSON.parse(fs.readFileSync(file, 'utf8')));
}

const sameNumber = (a, b) => (a === null || a === undefined ? null : Number(a)) === (b === null || b === undefined ? null : Number(b));

const manifest = readManifest();
const models = [];

for (const p of manifest.profiles) {
  const files = p.files.map((f) => ({ file: f, content: fs.readFileSync(path.join(root, ...f.split('/')), 'utf8') }));
  const m = buildProfileModel({ id: p.id, name: p.name }, files);
  models.push(m);
  console.log(`\n${p.name} (${p.id})`);

  const raw = files.flatMap((f) => extractRawRecords(f.content, f.file));
  check(m.labRecords.every((r) => r.profile_id === p.id), 'every shown record belongs to this profile');
  check(
    m.sourceCount === m.allRecords.length + m.duplicates.length + m.quarantined.length,
    `all ${m.sourceCount} records accounted for (${m.allRecords.length} kept, ${m.duplicates.length} duplicates, ${m.quarantined.length} quarantined)`,
  );
  const shownNames = new Set(m.allRecords.map((r) => r.original_name));
  check(raw.filter((r) => r.profile_id === p.id).every((r) => shownNames.has(r.test_name)), 'every test name in the files appears on the dashboard');

  const problems = [];
  for (const r of m.allRecords) {
    const src = raw.find((x) => x.test_name === r.original_name && x.collection_date === r.collection_date) || raw.find((x) => x.test_name === r.original_name);
    if (!sameNumber(src.reference_low, r.reference_low) || !sameNumber(src.reference_high, r.reference_high)) problems.push(`reference range changed for ${r.original_name}`);
    if (src.status && src.status !== r.status) problems.push(`status for ${r.original_name}: file says ${src.status}, computed ${r.status}`);
    if ((src.value === null || src.value === undefined || src.value === '') && r.value !== null) problems.push(`missing value filled in for ${r.original_name}`);
  }
  problems.forEach((msg) => check(false, msg));
  check(!problems.length, 'reference ranges preserved and computed status matches the file');
  check(m.labRecords.filter((r) => r.history.length < 2).every((r) => r.trend === 'New'), 'no trend invented for single measurements');
  const top = m.foodRecommendations.top10;
  check(top.length <= 10 && top.every((f) => f.supportsLabs.length > 0), `${top.length} top foods, each linked to one of this profile's results`);
}

if (models.length > 1) {
  console.log('\nSeparation');
  for (const a of models) {
    for (const b of models) {
      if (a === b) continue;
      const uids = new Set(a.labRecords.map((r) => r.uid));
      check(b.labRecords.every((r) => !uids.has(r.uid)), `${b.profile.name} shares no records with ${a.profile.name}`);
      const text = JSON.stringify(answer('Which results should I worry about?', a, foods)) + JSON.stringify(answer('What foods should I eat?', a, foods));
      check(!text.includes(b.profile.name), `${a.profile.name}'s answers never mention ${b.profile.name}`);
    }
  }
}

console.log(failures ? `\n${failures} check(s) failed` : '\nAll checks passed');
process.exit(failures ? 1 : 0);
