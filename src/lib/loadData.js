// Browser loader: reads <data dir>/profiles.json, then each profile's own files on demand.
import { BASE_URL, DATA_DIR } from './config.js';
import { validateManifest } from './manifest.js';

const dataUrl = (path) => `${BASE_URL}${DATA_DIR}/${path}`;

async function fetchFile(path) {
  const res = await fetch(dataUrl(path), { cache: 'no-store' });
  if (!res.ok) throw new Error(`Could not load ${DATA_DIR}/${path} (HTTP ${res.status}).`);
  return /\.csv$/i.test(path) ? res.text() : res.json();
}

export async function loadManifest() {
  let res;
  try {
    res = await fetch(dataUrl('profiles.json'), { cache: 'no-store' });
  } catch {
    throw new Error(`Could not reach ${DATA_DIR}/profiles.json. Is the dev server running?`);
  }
  if (!res.ok) throw new Error(`Could not load ${DATA_DIR}/profiles.json (HTTP ${res.status}). Check VITE_DATA_DIR in your .env file.`);
  let json;
  try {
    json = await res.json();
  } catch {
    throw new Error(`${DATA_DIR}/profiles.json is not valid JSON.`);
  }
  return validateManifest(json);
}

/** Loads one profile's bundled files. Files of other profiles are never fetched alongside. */
export async function loadProfileFiles(entry) {
  return Promise.all(entry.files.map(async (file) => ({ file, content: await fetchFile(file) })));
}

/** Uploaded reports for exactly this profile, in the same shape as bundled files. */
export function uploadedFilesFor(profileId, reports) {
  return reports
    .filter((r) => r.profile_id === profileId)
    .map((r) => ({ file: `upload:${r.file_name} (${r.id})`, content: r.records.map((x) => ({ ...x, profile_id: profileId })) }));
}
