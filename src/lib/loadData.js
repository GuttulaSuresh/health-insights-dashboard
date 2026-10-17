// Browser loader for bundled profiles: reads <dir>/profiles.json, then each profile's own files on demand.
import { BASE_URL } from './config.js';
import { validateManifest } from './manifest.js';

const dataUrl = (dir, path) => `${BASE_URL}${dir}/${path}`;

async function fetchFile(dir, path) {
  const res = await fetch(dataUrl(dir, path), { cache: 'no-store' });
  if (!res.ok) throw new Error(`Could not load ${dir}/${path} (HTTP ${res.status}).`);
  return /\.csv$/i.test(path) ? res.text() : res.json();
}

/**
 * Loads and validates <dir>/profiles.json. Each profile is tagged with where it came from so its files can
 * be fetched later. `source` is 'files' for VITE_DATA_DIR and 'sample' for the demo profiles.
 */
export async function loadManifest(dir, source) {
  let res;
  try {
    res = await fetch(dataUrl(dir, 'profiles.json'), { cache: 'no-store' });
  } catch {
    throw new Error(`Could not reach ${dir}/profiles.json. Is the server running?`);
  }
  if (!res.ok) throw new Error(`Could not load ${dir}/profiles.json (HTTP ${res.status}). Check VITE_DATA_DIR in your .env file.`);
  let json;
  try {
    json = await res.json();
  } catch {
    throw new Error(`${dir}/profiles.json is not valid JSON.`);
  }
  return validateManifest(json).profiles.map((p) => ({ ...p, source, dataDir: dir }));
}

/** Loads one profile's bundled files. Profiles created in the app have none. */
export async function loadProfileFiles(entry) {
  if (!entry?.dataDir || !entry.files?.length) return [];
  return Promise.all(entry.files.map(async (file) => ({ file, content: await fetchFile(entry.dataDir, file) })));
}

/** Uploaded reports for exactly this profile, in the same shape as bundled files. */
export function uploadedFilesFor(profileId, reports) {
  return reports
    .filter((r) => r.profile_id === profileId)
    .map((r) => ({ file: `upload:${r.file_name} (${r.id})`, content: r.records.map((x) => ({ ...x, profile_id: profileId })) }));
}
