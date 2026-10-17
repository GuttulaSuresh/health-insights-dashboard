// Persists reports added through the Add Report tab in the browser's localStorage.
// The API is async so a different backend (IndexedDB, a server) can be dropped in without touching callers.
//
// Saved report shape: { id, profile_id ('unassigned' until assigned), file_name, uploaded_at,
//                       collection_date, patient_name, laboratory, records: [lab records] }

export const STORAGE_KEY = 'health-insights.reports.v1';

function getStore() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    // Accessing localStorage throws in some privacy modes and sandboxed iframes.
    return null;
  }
}

function readAll() {
  const store = getStore();
  if (!store) return [];
  try {
    const list = JSON.parse(store.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

function writeAll(list) {
  const store = getStore();
  if (!store) throw new Error('Browser storage is not available, so the report cannot be saved.');
  store.setItem(STORAGE_KEY, JSON.stringify(list));
}

export async function listReports() {
  return readAll();
}

export async function saveReport(report) {
  writeAll([...readAll().filter((r) => r.id !== report.id), report]);
}

export async function deleteReport(id) {
  writeAll(readAll().filter((r) => r.id !== id));
}

export const newId = () => `r${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
