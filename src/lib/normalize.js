// Data parsing + normalization. Pure functions, no browser APIs, so they also run in Node (tests, verify script).
import { MARKERS, FILE_CATEGORY_MAP } from '../content/markers.js';

export function normName(s) {
  return String(s ?? '')
    .toLowerCase()
    .replace(/[‐-―]/g, '-')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}
const stripParens = (s) => String(s ?? '').replace(/\([^)]*\)/g, ' ');
const NOISE = /\b(calc|calculated|serum|plasma|martin hopkins|level|result)\b/g;

const ALIAS_INDEX = new Map();
for (const m of MARKERS) {
  for (const a of [m.id.replace(/_/g, ' '), m.short, m.name, ...(m.aliases || [])]) {
    const k = normName(a);
    if (k && !ALIAS_INDEX.has(k)) ALIAS_INDEX.set(k, m);
  }
}
export const MARKER_BY_ID = Object.fromEntries(MARKERS.map((m) => [m.id, m]));

/** Map any report spelling of a test to a catalog marker (or null if unknown). */
export function resolveMarker(testName) {
  const candidates = [
    normName(testName),
    normName(stripParens(testName)),
    normName(stripParens(testName)).replace(NOISE, '').replace(/\s+/g, ' ').trim(),
    normName(testName).replace(NOISE, '').replace(/\s+/g, ' ').trim(),
  ];
  for (const c of candidates) if (c && ALIAS_INDEX.has(c)) return ALIAS_INDEX.get(c);
  return null;
}

export function parseCSV(text) {
  const rows = [];
  let row = [], field = '', q = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (q) {
      if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') q = false;
      else field += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(field); field = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some((x) => x !== '')) rows.push(row);
      row = [];
    } else field += c;
  }
  row.push(field);
  if (row.some((x) => x !== '')) rows.push(row);
  const [head, ...body] = rows;
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h.trim(), r[i] === undefined || r[i] === '' ? null : r[i]])));
}

/** Accepts a JSON array, a {records:[...]} wrapper, or CSV text. Returns raw record objects. */
export function extractRawRecords(content, fileName = '') {
  if (typeof content === 'string') {
    if (/\.csv$/i.test(fileName) || !/^\s*[[{]/.test(content)) return parseCSV(content);
    content = JSON.parse(content);
  }
  if (Array.isArray(content)) return content;
  if (content && Array.isArray(content.records)) return content.records;
  throw new Error(`Unrecognized lab data format in ${fileName}`);
}

// Status (deterministic, from the lab's own reference range)
const num = (x) => {
  if (x === null || x === undefined || x === '') return null;
  const n = typeof x === 'number' ? x : Number(String(x).replace(/,/g, ''));
  return Number.isFinite(n) ? n : null;
};

export function referenceRule(rec) {
  const r = rec.reference_rule;
  if (['range', 'lt', 'le', 'ge', 'gt'].includes(r)) return r;
  const lo = num(rec.reference_low), hi = num(rec.reference_high);
  if (lo !== null && hi !== null) return 'range';
  if (lo === null && hi !== null) return 'lt'; // "<200" style limits printed by the lab
  if (lo !== null && hi === null) return 'ge'; // ">=60" style limits
  return null;
}

export function rangeText(lo, hi, rule, expected) {
  switch (rule) {
    case 'range': return `${lo}–${hi}`;
    case 'lt': return `< ${hi}`;
    case 'le': return `≤ ${hi}`;
    case 'ge': return `≥ ${lo}`;
    case 'gt': return `> ${lo}`;
    default: return expected ? `Expected: ${expected}` : 'Not reported';
  }
}

export function computeStatus({ value, lo, hi, rule, expected, fileStatus }) {
  if (value === null || value === undefined || value === '') {
    return String(fileStatus || '').toUpperCase().includes('NOT REPORTED') ? 'NOT REPORTED' : 'NOT AVAILABLE';
  }
  const v = num(value);
  if (v === null) {
    // Qualitative result, e.g. "NOT DETECTED"
    if (expected) return normName(value) === normName(expected) ? 'IN RANGE' : 'ABNORMAL';
    return ['IN RANGE', 'ABNORMAL'].includes(fileStatus) ? fileStatus : 'NO RANGE';
  }
  switch (rule) {
    case 'range': return v < lo ? 'LOW' : v > hi ? 'HIGH' : 'IN RANGE';
    case 'lt': return v >= hi ? 'HIGH' : 'IN RANGE';
    case 'le': return v > hi ? 'HIGH' : 'IN RANGE';
    case 'ge': return v < lo ? 'LOW' : 'IN RANGE';
    case 'gt': return v <= lo ? 'LOW' : 'IN RANGE';
    default: return 'NO RANGE';
  }
}

export const SEVERITY_RANK = { ok: 0, na: 0, watch: 1, attention: 2, priority: 3 };
export const SEVERITY_LABEL = {
  ok: 'Normal', watch: 'Watch', attention: 'Needs attention', priority: 'High priority', na: 'No data',
};

function deviation(v, lo, hi, status) {
  if (status === 'HIGH' && hi) return Math.abs(v - hi) / Math.abs(hi);
  if (status === 'LOW' && lo) return Math.abs(lo - v) / Math.abs(lo);
  return 0;
}

export function computeSeverity(marker, rec) {
  const { status } = rec;
  if (['NOT REPORTED', 'NOT AVAILABLE', 'NO RANGE'].includes(status)) return { level: 'na', note: '' };
  if (status === 'ABNORMAL') return { level: 'attention', note: 'Result differs from the expected result.' };
  const v = num(rec.value);
  const pct = v === null ? 0 : deviation(v, rec.reference_low, rec.reference_high, status);
  const ruled = marker?.rule ? marker.rule(v, rec, pct) : null;
  if (ruled) return ruled;
  if (status === 'IN RANGE') return { level: 'ok', note: '' };
  // Generic fallback: how far outside the lab's limit is the value?
  if (pct <= 0.1) return { level: 'watch', note: 'Slightly outside the lab range.' };
  if (pct <= 0.3) return { level: 'attention', note: 'Outside the lab range.' };
  return { level: 'priority', note: 'Well outside the lab range.' };
}

export function shortInterpretation(marker, rec) {
  const s = rec.status;
  if (s === 'NOT REPORTED') return 'The lab did not report this value.';
  if (s === 'NOT AVAILABLE') return 'Not available in the uploaded report.';
  if (s === 'NO RANGE') return 'No reference range was provided, so status cannot be set.';
  if (s === 'ABNORMAL') return 'Different from the expected result; worth reviewing.';
  const note = rec.severity !== 'ok' ? rec.severity_note || '' : '';
  const parts = [];
  if (s === 'IN RANGE') parts.push(rec.severity === 'watch' ? (note || 'In range, near the edge.') : 'Within the lab range.');
  if (s === 'HIGH') parts.push('Above the lab range.');
  if (s === 'LOW') parts.push('Below the lab range.');
  if (s !== 'IN RANGE' && note && !/^(below|above) the lab range\.?$/i.test(note)) parts.push(note.replace(/^(Below|Above) the lab range;\s*/i, '').replace(/^\w/, (c) => c.toUpperCase()));
  return parts.join(' ');
}

export function computeTrend(cur, prev, rec, marker) {
  const c = num(cur), p = num(prev);
  if (p === null || c === null) return { trend: 'New', direction: null, quality: null };
  const change = p === 0 ? (c === 0 ? 0 : 1) : (c - p) / Math.abs(p);
  // Clinically meaningful change: marker-specific absolute delta when defined, otherwise 5%.
  const meaningful = marker?.trendDelta ? Math.abs(c - p) >= marker.trendDelta : Math.abs(change) >= 0.05;
  const direction = !meaningful ? 'stable' : change > 0 ? 'up' : 'down';
  // Did the value move toward or away from the lab range?
  const outside = (v) => {
    const { reference_low: lo, reference_high: hi } = rec;
    if (lo !== null && lo !== undefined && v < lo) return lo - v;
    if (hi !== null && hi !== undefined && v > hi) return v - hi;
    return 0;
  };
  const dOut = outside(c) - outside(p);
  const quality = direction === 'stable' ? 'stable' : dOut < 0 ? 'improving' : dOut > 0 ? 'worsening' : 'neutral';
  const label = { up: '↑ Increasing', down: '↓ Decreasing', stable: '→ Stable' }[direction];
  return { trend: label, direction, quality, change };
}

/**
 * @param {{id:string,name:string}} profile  manifest entry
 * @param {{file:string, content:any}[]} files raw file contents (JSON object/array or CSV text)
 * Every record whose profile_id does not match `profile.id` is quarantined, never shown.
 */
export function normalizeProfileData(profile, files) {
  const accepted = [];
  const quarantined = [];
  const duplicates = [];
  const quality = [];
  let sourceCount = 0;

  for (const { file, content } of files) {
    const raws = extractRawRecords(content, file);
    raws.forEach((raw, i) => {
      sourceCount++;
      const pid = String(raw.profile_id ?? '').trim().toLowerCase();
      if (!pid) { quarantined.push({ file, raw, reason: 'Missing profile assignment' }); return; }
      if (pid !== profile.id) { quarantined.push({ file, raw, reason: `Belongs to profile "${pid}", not "${profile.id}"` }); return; }
      accepted.push(normalizeRecord(profile, raw, file, i, quality));
    });
  }

  // De-duplicate: same marker, same date, same value.
  const seen = new Map();
  const unique = [];
  for (const r of accepted) {
    const key = `${r.marker_id}|${r.collection_date}|${r.value}`;
    if (seen.has(key)) { duplicates.push({ kept: seen.get(key), dropped: r }); continue; }
    seen.set(key, r);
    unique.push(r);
  }
  if (duplicates.length) quality.push({ type: 'duplicate', text: `${duplicates.length} duplicate result(s) from the same sample were counted once.` });

  // History per marker -> previous value + trend.
  const byMarker = new Map();
  for (const r of unique) {
    if (!byMarker.has(r.marker_id)) byMarker.set(r.marker_id, []);
    byMarker.get(r.marker_id).push(r);
  }
  const latest = [];
  for (const [, list] of byMarker) {
    list.sort((a, b) => String(a.collection_date).localeCompare(String(b.collection_date)));
    const units = new Set(list.filter((r) => r.unit).map((r) => r.unit));
    if (units.size > 1) quality.push({ type: 'unit', text: `${list[0].test_name} appears with different units (${[...units].join(', ')}); trend not compared across units.` });
    const numericHistory = list.filter((r) => num(r.value) !== null && r.collection_date);
    const cur = list[list.length - 1];
    const prevRec = [...numericHistory].reverse().find((r) => r !== cur && r.collection_date < cur.collection_date && (units.size <= 1 || r.unit === cur.unit));
    const history = numericHistory
      .filter((r) => units.size <= 1 || r.unit === cur.unit)
      .map((r) => ({ date: r.collection_date, value: num(r.value), status: r.status }));
    let previous_value = prevRec ? prevRec.value : cur.file_previous_value;
    let previous_date = prevRec ? prevRec.collection_date : null;
    const t = computeTrend(cur.value, previous_value, cur, MARKER_BY_ID[cur.marker_id]);
    latest.push({ ...cur, previous_value: previous_value ?? null, previous_date, history, ...t });
  }

  const dates = unique.map((r) => r.collection_date).filter(Boolean).sort();
  return {
    profile,
    records: latest,
    allRecords: unique,
    quarantined,
    duplicates,
    quality,
    sourceCount,
    latestDate: dates[dates.length - 1] || null,
    dates: [...new Set(dates)],
    sources: [...new Set(unique.map((r) => `${r.source || 'Unknown source'} · ${r.laboratory_name || 'Unknown lab'}`))],
    reports: [...new Set(unique.map((r) => r.report).filter(Boolean))],
  };
}

function normalizeRecord(profile, raw, file, index, quality) {
  const marker = resolveMarker(raw.test_name);
  const lo = num(raw.reference_low), hi = num(raw.reference_high);
  const rule = referenceRule({ ...raw, reference_low: lo, reference_high: hi });
  const rawValue = raw.value === undefined ? null : raw.value;
  const value = num(rawValue) !== null ? num(rawValue) : rawValue === null || rawValue === '' ? null : String(rawValue);
  const fileStatus = raw.status ? String(raw.status).toUpperCase() : null;
  const status = computeStatus({ value, lo, hi, rule, expected: marker?.expected, fileStatus });
  const categoryId = marker?.category || FILE_CATEGORY_MAP[normName(raw.category).replace(/ /g, '/')] || FILE_CATEGORY_MAP[String(raw.category || '').toLowerCase()] || 'other';

  const rec = {
    uid: `${profile.id}:${file}:${index}`,
    profile_id: profile.id,
    profile_name: profile.name,
    marker_id: marker ? marker.id : `x_${normName(raw.test_name).replace(/ /g, '_')}`,
    known_marker: !!marker,
    test_name: marker ? marker.short : raw.test_name,
    full_name: marker ? marker.name : raw.test_name,
    original_name: raw.test_name,
    category: categoryId,
    value,
    unit: raw.unit === 'ratio' ? '' : raw.unit || '',
    reference_low: lo,
    reference_high: hi,
    reference_rule: rule,
    range_text: rangeText(lo, hi, rule, marker?.expected),
    status,
    file_status: fileStatus,
    collection_date: raw.collection_date || null,
    source: raw.source || null,
    laboratory_name: raw.laboratory_name || null,
    report: raw.report || null,
    notes: raw.notes || '',
    lab_flag: raw.lab_flag || null,
    file_previous_value: raw.previous_value ?? null,
    file,
  };
  const sev = computeSeverity(marker, rec);
  rec.severity = sev.level;
  rec.severity_note = sev.note;
  rec.interpretation = shortInterpretation(marker, rec);

  if (!marker) quality.push({ type: 'unknown', text: `"${raw.test_name}" is not in the marker catalog; shown under ${categoryId === 'other' ? 'Other Tests' : 'its file category'} with generic wording.` });
  if (!rec.collection_date) quality.push({ type: 'date', text: `${rec.test_name} has no collection date.` });
  if (typeof value === 'number' && !raw.unit) quality.push({ type: 'unit', text: `${rec.test_name} has no unit.` });
  if (fileStatus && fileStatus !== status && !(fileStatus === 'NOT REPORTED' && status === 'NOT REPORTED')) {
    quality.push({ type: 'status', text: `${rec.test_name}: file says "${fileStatus}", recalculated from the lab range as "${status}". The recalculated status is shown.` });
  }
  if (/comment/i.test(rec.notes)) quality.push({ type: 'range', text: `${rec.test_name}: reference range was taken from a lab comment.` });
  return rec;
}
