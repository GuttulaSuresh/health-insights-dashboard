// Runtime configuration. Values come from Vite env variables (see .env.example) with safe defaults.

/** Normalizes a folder name under public/. Returns null when unset; rejects anything that could escape public/. */
export function resolveDataDir(value) {
  const dir = String(value ?? '').trim().replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
  if (!dir) return null;
  if (dir.split('/').some((part) => part === '..' || part === '.')) {
    throw new Error(`VITE_DATA_DIR must be a folder inside public/, got "${value}"`);
  }
  return dir;
}

const env = import.meta.env ?? {};

/** Optional folder of bundled profiles (profiles.json + lab files). Unset means the app starts empty. */
export const DATA_DIR = resolveDataDir(env.VITE_DATA_DIR);
/** Synthetic demo profiles, shown only when the viewer asks for them. */
export const SAMPLE_DIR = 'sample-data';
export const BASE_URL = env.BASE_URL || './';
