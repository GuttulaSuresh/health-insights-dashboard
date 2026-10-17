// Validation for profiles.json, shared by the browser loader and scripts/verify-data.mjs.

const ID_PATTERN = /^[a-z0-9][a-z0-9_-]*$/;
const RESERVED_IDS = new Set(['unassigned']);

/**
 * Throws a descriptive error if the manifest cannot be used.
 * @returns {{profiles: {id: string, name: string, match: string[], files: string[]}[]}}
 */
export function validateManifest(manifest) {
  if (!manifest || !Array.isArray(manifest.profiles)) {
    throw new Error('profiles.json must contain a "profiles" array.');
  }
  if (!manifest.profiles.length) {
    throw new Error('profiles.json has no profiles. Add at least one profile (see docs/DATA_FORMAT.md).');
  }
  const seen = new Set();
  const profiles = manifest.profiles.map((p, i) => {
    const where = `profiles[${i}]`;
    if (!p || typeof p !== 'object') throw new Error(`${where} must be an object.`);
    if (typeof p.id !== 'string' || !ID_PATTERN.test(p.id)) {
      throw new Error(`${where}.id must be lowercase letters, digits, "-" or "_" (got ${JSON.stringify(p.id)}).`);
    }
    if (RESERVED_IDS.has(p.id)) throw new Error(`${where}.id "${p.id}" is reserved.`);
    if (seen.has(p.id)) throw new Error(`Duplicate profile id "${p.id}".`);
    seen.add(p.id);
    if (typeof p.name !== 'string' || !p.name.trim()) throw new Error(`${where}.name is required.`);
    if (p.files !== undefined && !Array.isArray(p.files)) throw new Error(`${where}.files must be an array.`);
    if (p.match !== undefined && !Array.isArray(p.match)) throw new Error(`${where}.match must be an array.`);
    for (const f of p.files || []) {
      if (typeof f !== 'string' || f.startsWith('/') || f.split(/[\\/]/).includes('..')) {
        throw new Error(`${where}.files contains an invalid path: ${JSON.stringify(f)}. Use paths relative to the data folder.`);
      }
    }
    return { id: p.id, name: p.name.trim(), match: p.match || [], files: p.files || [] };
  });
  return { ...manifest, profiles };
}
