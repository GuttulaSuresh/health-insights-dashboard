// Helpers for creating profiles from the name printed on a lab report.

const RESERVED = new Set(['unassigned']);
const SAMPLE_PREFIX = 'sample-';

const titleCase = (s) => s.toLowerCase().replace(/(^|[\s'-])(\p{L})/gu, (m, sep, ch) => sep + ch.toUpperCase());

/** "DOE, JOHN A" -> "John A Doe"; "jane doe" -> "Jane Doe". Returns '' when there is no usable name. */
export function displayNameFromReport(name) {
  const raw = String(name ?? '').replace(/\s+/g, ' ').trim();
  if (!raw) return '';
  const comma = raw.indexOf(',');
  const ordered = comma > 0 ? `${raw.slice(comma + 1).trim()} ${raw.slice(0, comma).trim()}` : raw;
  return titleCase(ordered.trim());
}

/** A lowercase, URL-safe id that does not clash with existing ids or the reserved sample prefix. */
export function makeProfileId(name, existingIds = []) {
  const taken = new Set(existingIds);
  let base = String(name ?? '')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'person';
  if (base.startsWith(SAMPLE_PREFIX) || RESERVED.has(base)) base = `p-${base}`;
  let id = base;
  for (let n = 2; taken.has(id); n++) id = `${base}-${n}`;
  return id;
}

export function createProfile(name, { match = [], existingIds = [] } = {}) {
  const clean = String(name ?? '').trim();
  if (!clean) throw new Error('A profile needs a name.');
  return {
    id: makeProfileId(clean, existingIds),
    name: clean,
    match: [...new Set(match.filter(Boolean))],
    created_at: new Date().toISOString(),
  };
}
