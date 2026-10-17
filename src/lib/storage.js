// Persists what people add in the app (profiles, reports, preferences) in the browser's localStorage.
// The API is async so a different backend (IndexedDB, a server) can be dropped in without touching callers.
//
// Saved report shape:  { id, profile_id ('unassigned' until assigned), file_name, uploaded_at,
//                        collection_date, patient_name, laboratory, records: [lab records] }
// Saved profile shape: { id, name, match: [names as printed on reports], created_at }

export const STORAGE_KEY = 'health-insights.reports.v1';
export const PROFILES_KEY = 'health-insights.profiles.v1';
export const SAMPLE_KEY = 'health-insights.show-sample.v1';

function getStore() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    // Accessing localStorage throws in some privacy modes and sandboxed iframes.
    return null;
  }
}

function readList(key) {
  const store = getStore();
  if (!store) return [];
  try {
    const list = JSON.parse(store.getItem(key) || '[]');
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function writeList(key, list) {
  const store = getStore();
  if (!store) throw new Error('Browser storage is not available, so changes cannot be saved.');
  store.setItem(key, JSON.stringify(list));
}

const upsert = (key, item) => writeList(key, [...readList(key).filter((x) => x.id !== item.id), item]);
const remove = (key, id) => writeList(key, readList(key).filter((x) => x.id !== id));

export async function listReports() {
  return readList(STORAGE_KEY);
}

export async function saveReport(report) {
  upsert(STORAGE_KEY, report);
}

export async function deleteReport(id) {
  remove(STORAGE_KEY, id);
}

export async function listProfiles() {
  return readList(PROFILES_KEY).filter((p) => p && typeof p.id === 'string' && typeof p.name === 'string');
}

export async function saveProfile(profile) {
  upsert(PROFILES_KEY, profile);
}

/** Deletes a profile created in the app together with every report saved for it. */
export async function deleteProfile(id) {
  writeList(STORAGE_KEY, readList(STORAGE_KEY).filter((r) => r.profile_id !== id));
  remove(PROFILES_KEY, id);
}

export function getShowSample() {
  try {
    return getStore()?.getItem(SAMPLE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setShowSample(value) {
  try {
    getStore()?.setItem(SAMPLE_KEY, String(Boolean(value)));
  } catch {
    // The preference is a convenience; losing it only means the sample data is hidden next time.
  }
}

export const newId = () => `r${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
