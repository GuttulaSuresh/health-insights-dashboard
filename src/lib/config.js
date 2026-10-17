// Runtime configuration. Values come from Vite env variables (see .env.example) with safe defaults.

/** Normalizes a folder name under public/ and rejects anything that could escape it. */
export function resolveDataDir(value) {
  const dir = String(value ?? '').trim().replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
  if (!dir) return 'data';
  if (dir.split('/').some((part) => part === '..' || part === '.')) {
    throw new Error(`VITE_DATA_DIR must be a folder inside public/, got "${value}"`);
  }
  return dir;
}

const env = import.meta.env ?? {};

export const DATA_DIR = resolveDataDir(env.VITE_DATA_DIR);
export const BASE_URL = env.BASE_URL || './';
