// Compares each result with the same test on the previous report, so advice can say what changed:
// "LDL fell from 162 to 141 mg/dL since 12 Mar 2026". Only this profile's own history is used.

export const NEED_OF_MARKER = {
  hba1c: 'glycemic', fasting_glucose: 'glycemic', triglycerides: 'triglycerides', ldl: 'ldl', non_hdl: 'ldl',
  total_cholesterol: 'ldl', chol_hdl_ratio: 'ldl', hdl: 'hdl', mcv: 'iron', mch: 'iron', hemoglobin: 'iron',
  ferritin: 'iron', iron: 'iron', iron_saturation: 'iron', tibc: 'iron', vitamin_d: 'vitd', vitamin_b12: 'b12',
  folate: 'folate', alt: 'liver', ast: 'liver', egfr: 'kidney', creatinine: 'kidney',
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function shortDate(iso) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(iso || ''));
  return m ? `${Number(m[3])} ${MONTHS[Number(m[2]) - 1]} ${m[1]}` : String(iso || '');
}

const OUT = new Set(['HIGH', 'LOW']);
const sideWord = (status) => (status === 'HIGH' ? 'above' : 'below');

// Display order: what needs attention first, good news after.
export const PROGRESS_ORDER = ['worsening', 'new_out', 'unchanged', 'improving', 'back_in_range'];

function classify(prevStatus, rec) {
  const cur = rec.status;
  if (OUT.has(prevStatus) && cur === 'IN RANGE') return 'back_in_range';
  if (prevStatus === 'IN RANGE' && OUT.has(cur)) return 'new_out';
  if (!OUT.has(cur)) return null;
  if (rec.quality === 'improving') return 'improving';
  if (rec.quality === 'worsening') return 'worsening';
  return 'unchanged';
}

function changeText(from, to) {
  if (from === 0) return '';
  const p = Math.round(((to - from) / Math.abs(from)) * 100);
  return p === 0 ? '' : ` (${p > 0 ? '+' : '−'}${Math.abs(p)}%)`;
}

/**
 * One entry per test that has an earlier result to compare with and something worth saying.
 * `weights` are the lab-driven needs before trends, used to say when a worsening result changes the suggestions.
 */
export function buildProgress(records, weights = {}) {
  const items = [];
  for (const rec of records) {
    const h = rec.history || [];
    if (h.length < 2) continue;
    const prev = h[h.length - 2];
    const value = h[h.length - 1].value;
    const kind = classify(prev.status, rec);
    if (!kind) continue;
    const unit = rec.unit ? ` ${rec.unit}` : '';
    const need = NEED_OF_MARKER[rec.marker_id] || null;
    const boosted = Boolean(need && weights[need] && weights[need] < 3);
    const verb = value > prev.value ? 'rose' : value < prev.value ? 'fell' : 'stayed';
    const movement = verb === 'stayed'
      ? `${rec.test_name} stayed at ${value}${unit} since ${shortDate(prev.date)}.`
      : `${rec.test_name} ${verb} from ${prev.value} to ${value}${unit} since ${shortDate(prev.date)}${changeText(prev.value, value)}.`;
    const advice = {
      back_in_range: 'It is back within the lab range. Keep doing what changed.',
      improving: `Moving toward the lab range (${rec.range_text}). Keep going.`,
      worsening: `Moving further ${sideWord(rec.status)} the lab range (${rec.range_text}).${boosted ? ' Food suggestions now give it more weight.' : ''}`,
      new_out: `It was in range last time and is now ${sideWord(rec.status)} it (${rec.range_text}).${boosted ? ' Food suggestions now give it more weight.' : ''}`,
      unchanged: `About the same as last time and still ${sideWord(rec.status)} the lab range (${rec.range_text}).`,
    }[kind];
    const first = h.length >= 3 ? h[0] : null;
    items.push({
      marker_id: rec.marker_id,
      test_name: rec.test_name,
      need,
      kind,
      from: prev.value,
      to: value,
      since: prev.date,
      text: `${movement} ${advice}`,
      overall: first ? `Since the first result on ${shortDate(first.date)} (${first.value}${unit}), it has changed${changeText(first.value, value) || ' very little'}.` : null,
      rec,
    });
  }
  return items.sort((a, b) => PROGRESS_ORDER.indexOf(a.kind) - PROGRESS_ORDER.indexOf(b.kind));
}

/**
 * Adds trend information to lab-driven needs: a need whose results are getting worse gets one more point of
 * weight (up to 3), and `trends[need]` records the most important change for display.
 */
export function applyProgress(needs, progress) {
  const weights = { ...needs.weights };
  const trends = {};
  for (const p of progress) {
    if (!p.need) continue;
    const current = trends[p.need];
    if (!current || PROGRESS_ORDER.indexOf(p.kind) < PROGRESS_ORDER.indexOf(current)) trends[p.need] = p.kind;
  }
  for (const [need, kind] of Object.entries(trends)) {
    if ((kind === 'worsening' || kind === 'new_out') && weights[need]) weights[need] = Math.min(3, weights[need] + 1);
  }
  return { ...needs, weights, trends };
}
