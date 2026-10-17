// Turns the text of a lab report (one string per printed line) into draft lab records.
// Pure function, no browser APIs. Nothing is saved until the person reviews and confirms.
// Expects column layouts like "NAME  VALUE [H|L]  RANGE (unit)  LAB", as printed by large US reference labs.
import { resolveMarker } from './normalize.js';

const STATUS_PREFIX = /^(F|C|P|X)$/; // result-status column: Final, Corrected, Preliminary, Cancelled
const QUALITATIVE = /^(NOT DETECTED|DETECTED|NEGATIVE|POSITIVE|NON-REACTIVE|REACTIVE)$/i;
const VALUE_TOKEN = /^(-?\d+(?:\.\d+)?|[<>]\s*\d+(?:\.\d+)?|NOT DETECTED|DETECTED|NEGATIVE|POSITIVE|NON-REACTIVE|REACTIVE|SEE NOTE:?|TNP|QNS)(?:\s+(H|L|HH|LL|A|AH|AL))?$/i;
const LAB_CODE = /^[A-Z]{2,3}$/;
const TITLE = /^[A-Z0-9][A-Z0-9 ,/().%&'+-]+\(\d{2,6}\)\s*$/;

const toISO = (mdy) => {
  const m = String(mdy).match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  return m ? `${m[3]}-${m[1].padStart(2, '0')}-${m[2].padStart(2, '0')}` : null;
};

/** "<200", "> OR = 40", "65-99", "Normal: >5.4", "> or = 20 Years 0.40-4.50" -> range */
export function parseRange(text) {
  const t = String(text || '').replace(/\s+/g, ' ').trim();
  if (!t) return null;
  let m;
  if ((m = t.match(/(-?\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)\s*$/)) && !/^[<>]/.test(t)) return { low: +m[1], high: +m[2], rule: 'range' };
  if ((m = t.match(/(-?\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/))) return { low: +m[1], high: +m[2], rule: 'range' };
  if ((m = t.match(/<\s*OR\s*=\s*(\d+(?:\.\d+)?)/i))) return { low: null, high: +m[1], rule: 'le' };
  if ((m = t.match(/>\s*OR\s*=\s*(\d+(?:\.\d+)?)/i))) return { low: +m[1], high: null, rule: 'ge' };
  if ((m = t.match(/(?:^|\s|:)<\s*=\s*(\d+(?:\.\d+)?)/))) return { low: null, high: +m[1], rule: 'le' };
  if ((m = t.match(/(?:^|\s|:)>\s*=\s*(\d+(?:\.\d+)?)/))) return { low: +m[1], high: null, rule: 'ge' };
  if ((m = t.match(/(?:^|\s|:)<\s*(\d+(?:\.\d+)?)/))) return { low: null, high: +m[1], rule: 'lt' };
  if ((m = t.match(/(?:^|\s|:)>\s*(\d+(?:\.\d+)?)/))) return { low: +m[1], high: null, rule: 'gt' };
  return null;
}

/** Splits "<200 (mg/dL (calc))" into range text and unit. */
function splitRangeUnit(s) {
  const str = s.trim();
  const open = str.indexOf('(');
  if (open === -1) return { rangeText: str, unit: '' };
  let depth = 0, end = -1;
  for (let i = open; i < str.length; i++) {
    if (str[i] === '(') depth++;
    if (str[i] === ')') { depth--; if (depth === 0) { end = i; break; } }
  }
  const inner = str.slice(open + 1, end === -1 ? undefined : end);
  const unit = inner.replace(/\(\s*calc\s*\)/gi, '').replace(/\bcalc\b/gi, '').replace(/[()]/g, '').trim();
  return { rangeText: str.slice(0, open).trim(), unit, calculated: /calc/i.test(inner) };
}

/** Tries to read one result row. Returns null for anything that is not a result. */
export function parseResultLine(line) {
  let tokens = line.trim().split(/\s{2,}/).map((t) => t.trim()).filter(Boolean);
  if (tokens.length < 2) return null;
  const hadStatus = STATUS_PREFIX.test(tokens[0]);
  if (hadStatus) tokens = tokens.slice(1);
  if (tokens.length < 2) return null;
  const name = tokens[0];
  // flag printed in its own column: "243    H    <150"
  if (tokens.length > 2 && /^(H|L|HH|LL|A|AH|AL)$/.test(tokens[2]) && /^-?\d/.test(tokens[1])) tokens = [tokens[0], `${tokens[1]} ${tokens[2]}`, ...tokens.slice(3)];
  if (!VALUE_TOKEN.test(tokens[1])) {
    // value and range printed close together, e.g. "1.18 (mIU/L)" or "243 H <200 (mg/dL)"
    const sp = tokens[1].match(/^(-?\d+(?:\.\d+)?(?:\s+(?:H|L|HH|LL|A))?)\s+([(<>\d].*)$/);
    if (sp) tokens = [tokens[0], sp[1], sp[2], ...tokens.slice(2)];
  }
  const vm = tokens[1].match(VALUE_TOKEN);
  if (!vm) return null;
  const marker = resolveMarker(name);
  if (!hadStatus && !marker) return null; // avoid picking up comment lines
  if (/^(name|test|result)$/i.test(name)) return null;
  let rest = tokens.slice(2);
  if (rest.length && LAB_CODE.test(rest[rest.length - 1])) rest = rest.slice(0, -1);
  const { rangeText, unit, calculated } = splitRangeUnit(rest.join(' '));
  const rawVal = vm[1].replace(/\s+/g, ' ');
  let value = null, expected = null, notReported = false;
  if (/^SEE NOTE|^TNP|^QNS/i.test(rawVal)) notReported = true;
  else if (QUALITATIVE.test(rawVal)) { value = rawVal.toUpperCase(); if (QUALITATIVE.test(rangeText)) expected = rangeText.toUpperCase(); }
  else value = Number(rawVal.replace(/[<>\s]/g, ''));
  const range = expected ? null : parseRange(rangeText);
  return {
    test_name: name, marker_id: marker?.id || null, value, notReported, expected,
    lab_flag: vm[2] ? vm[2].toUpperCase() : null, unit, calculated,
    reference_low: range?.low ?? null, reference_high: range?.high ?? null, reference_rule: range?.rule ?? null,
    range_source: range ? 'report' : null,
  };
}

/**
 * @param {string[]} lines text lines of the whole report (all pages)
 * @returns {{patientName, collectionDate, laboratory, reports, fasting, records, unparsed}}
 */
export function parseReportLines(lines) {
  const text = lines.join('\n');
  const patient = text.match(/^\s*([A-Z][A-Z'’ .-]+,\s*[A-Za-z][A-Za-z'’ .-]*?)\s+DOB:/m)
    || text.match(/Patient(?:\s*Name)?:\s*([A-Za-z'’ .,-]+?)(?:\s{2,}|\s+DOB|$)/im);
  const collected = text.match(/Collect(?:ion|ed)(?:\s*Date)?(?:\/Time)?:\s*(\d{1,2}\/\d{1,2}\/\d{4})/i);
  const lab = text.match(/PERFORMING LAB:\s*[A-Z]{1,3},\s*([^\n]+)/i);
  const reports = [...new Set(lines.map((l) => l.trim()).filter((l) => TITLE.test(l) && !/^NAME\b/.test(l)))];
  const fasting = /FASTING:\s*YES/i.test(text);

  const records = [];
  let currentReport = reports[0] || null;
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim();
    if (TITLE.test(t)) { currentReport = t; continue; }
    const r = parseResultLine(lines[i]);
    if (!r) continue;
    // Range printed in the notes below the row ("Reference range: <100", "> or = 20 Years 0.40-4.50", "Normal: >5.4")
    if (!r.reference_rule && !r.expected && !r.notReported) {
      for (let j = i + 1; j < Math.min(lines.length, i + 25); j++) {
        const n = lines[j].trim();
        if (parseResultLine(lines[j]) || TITLE.test(n)) break;
        let rg = null;
        if (/reference range\s*:/i.test(n)) rg = parseRange(n.split(/:/).slice(1).join(':'));
        else if (/>\s*or\s*=\s*(18|20|21)\s*years/i.test(n)) rg = parseRange(n.replace(/^.*years/i, ''));
        else if (/^normal\s*:/i.test(n)) rg = parseRange(n.replace(/^normal\s*:/i, ''));
        else if (/^adults?\b.*\d/i.test(n)) rg = parseRange(n.replace(/^adults?\s*:?/i, ''));
        if (rg) { Object.assign(r, { reference_low: rg.low, reference_high: rg.high, reference_rule: rg.rule, range_source: 'report note' }); break; }
      }
    }
    records.push({ ...r, report: currentReport });
  }
  return {
    patientName: patient ? patient[1].trim().replace(/\s+/g, ' ') : null,
    collectionDate: collected ? toISO(collected[1]) : null,
    laboratory: lab ? lab[1].trim() : null,
    reports, fasting, records,
  };
}

/** Suggest which profile a report belongs to from the patient name printed on it. */
export function suggestProfile(patientName, profiles) {
  if (!patientName) return null;
  const n = patientName.toLowerCase();
  const hits = profiles.filter((p) => [p.name, ...(p.match || [])].some((x) => n.includes(String(x).toLowerCase())));
  return hits.length === 1 ? hits[0].id : null;
}

/** Turn reviewed draft rows into the app's standard lab-record shape for one profile. */
export function toLabRecords(rows, { profile, collectionDate, laboratory, source, fasting }) {
  return rows.filter((r) => r.include).map((r) => ({
    profile_id: profile.id,
    profile_name: profile.name,
    test_name: r.test_name,
    value: r.notReported ? null : r.value === '' ? null : r.value,
    unit: r.unit || '',
    reference_low: r.reference_low === '' ? null : r.reference_low,
    reference_high: r.reference_high === '' ? null : r.reference_high,
    reference_rule: r.reference_rule || null,
    status: r.notReported ? 'NOT REPORTED' : undefined,
    collection_date: r.collection_date || collectionDate,
    source,
    laboratory_name: laboratory || null,
    report: r.report || null,
    lab_flag: r.lab_flag || null,
    notes: [r.range_source === 'report note' ? 'Range taken from a lab comment' : '', r.range_source === 'previous report' ? 'Range copied from an earlier report' : '', fasting ? 'Fasting: yes' : ''].filter(Boolean).join('; '),
  }));
}
