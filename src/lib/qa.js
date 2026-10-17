// "Ask About My Results": an offline, rule-based answer engine.
// It only receives the selected profile's model, so it cannot reference anyone else's results.
import { MARKERS } from '../content/markers.js';
import { normName, MARKER_BY_ID } from './normalize.js';
import { fmt } from './insights.js';
import { foodsForNeed } from './nutrition.js';
import { NEED_OF_MARKER } from './progress.js';

const SKIP_ALIASES = new Set(['k', 'na', 'ca', 'mg', 'cl', 'hb', 'iron total']);
const TOPIC_WORDS = [
  { re: /\b(sugar|diabetes|diabetic|glucose|prediabet\w*)\b/, markers: ['hba1c', 'fasting_glucose'] },
  { re: /\b(cholesterol|lipids?|lipid panel|heart)\b/, markers: ['ldl', 'hdl', 'triglycerides', 'non_hdl', 'total_cholesterol'] },
  { re: /\b(anemi\w*|anaemi\w*|red (blood )?cells?)\b/, markers: ['hemoglobin', 'mcv', 'mch', 'ferritin'] },
  { re: /\b(iron)\b/, markers: ['ferritin', 'iron', 'iron_saturation', 'tibc', 'mcv', 'mch'] },
  { re: /\b(thyroid)\b/, markers: ['tsh', 'free_t4'] },
  { re: /\b(kidneys?|renal)\b/, markers: ['egfr', 'creatinine', 'bun'] },
  { re: /\b(liver)\b/, markers: ['alt', 'ast', 'alp', 'bilirubin_total'] },
  { re: /\bvit(amin)?\s*d\b|\bsun(light)?\b/, markers: ['vitamin_d'] },
  { re: /\bvit(amin)?\s*b\s*12\b|\bb12\b/, markers: ['vitamin_b12'] },
];

const ALIASES = MARKERS.flatMap((m) => [m.short, ...(m.aliases || [])].map((a) => ({ id: m.id, a: normName(a) })))
  .filter((x) => x.a && !SKIP_ALIASES.has(x.a))
  .sort((x, y) => y.a.length - x.a.length);

export function detectMarkers(q) {
  let text = ` ${normName(q)} `;
  const ids = [];
  for (const { id, a } of ALIASES) {
    if (text.includes(` ${a} `)) {
      if (!ids.includes(id)) ids.push(id);
      text = text.replace(` ${a} `, ' # ');
    }
  }
  if (!ids.length) {
    const raw = q.toLowerCase();
    for (const t of TOPIC_WORDS) if (t.re.test(raw)) ids.push(...t.markers.filter((x) => !ids.includes(x)));
  }
  return ids;
}

const statusWord = (r) => ({ HIGH: 'above the lab range', LOW: 'below the lab range', 'IN RANGE': 'within the lab range', 'NOT REPORTED': 'not reported by the lab', 'NOT AVAILABLE': 'not available' }[r.status] || r.status.toLowerCase());

export function answer(question, model) {
  const name = model.profile.name;
  const q = question.toLowerCase();
  const recs = Object.fromEntries(model.labRecords.map((r) => [r.marker_id, r]));
  const ids = detectMarkers(question);
  const present = ids.filter((id) => recs[id]);
  const missing = ids.filter((id) => !recs[id]);
  const findings = model.healthInsights.findings;
  const blocks = [];
  const refs = [];
  const say = (t) => blocks.push({ type: 'p', text: t });
  const bullets = (items) => items.length && blocks.push({ type: 'ul', items });

  const intent =
    /\b(repeat|recheck|re-check|retest|follow[- ]?up|next (appointment|visit)|which (labs|tests)|what tests|ask (my|the) doctor)\b/.test(q) ? 'repeat'
    : /\b(this week|meal plan|what should i eat|eat today|diet plan|what to eat|what can i eat)\b/.test(q) && !present.length ? 'week'
    : /\b(worry|worried|concern|serious|urgent|attention|priority|abnormal|bad|wrong|flagged|out of range)\b/.test(q) && !present.length ? 'worry'
    : /\b(score|wellness)\b/.test(q) ? 'score'
    : /\b(since (my |the )?(last|previous) (report|test|result)s?|what changed|progress)\b/.test(q) && !present.length ? 'progress'
    : /\b(trend|chang\w*|getting (better|worse)|improv(ed|ing)|over time|history)\b/.test(q) && !/\bhow (can|do|to)\b/.test(q) ? 'trend'
    : /\b(food|foods|eat|diet|nutrition|meal)\b/.test(q) ? 'foods'
    : /\b(improve|raise|increase|lower|reduce|boost|fix|bring (it )?(up|down)|get .* (up|down))\b/.test(q) ? 'improve'
    : /\bwhy\b/.test(q) ? 'why'
    : ids.length ? 'status'
    : 'help';

  if (missing.length && !present.length && !['repeat', 'week', 'worry', 'score'].includes(intent)) {
    const names = missing.map((id) => MARKER_BY_ID[id]?.short || id);
    say(`${names.join(', ')} ${missing.length > 1 ? 'are' : 'is'} not in ${name}'s uploaded results, so there is nothing to interpret. Not available.`);
    const linked = model.healthInsights.followUpTests.filter((t) => names.some((n) => t.test.toLowerCase().includes(n.toLowerCase())));
    if (linked.length) say(`It is on the list of tests to discuss with a healthcare professional because of: ${linked[0].reasons.join('; ')}.`);
    return { blocks, refs };
  }

  switch (intent) {
    case 'worry': {
      const top = findings.filter((f) => !f.lowConcern);
      if (!top.length) { say(`None of ${name}'s results are flagged. Everything reported is within the lab ranges.`); break; }
      say(`Here is what stands out in ${name}'s results, most important first:`);
      bullets(top.map((f) => `**${f.title}** (${f.level}): ${f.evidence.map(fmt).join(', ')}`));
      const pri = top.filter((f) => f.severity === 'priority');
      say(pri.length ? 'The first item is worth discussing with a healthcare professional soon. None of these alone is a diagnosis.' : 'None of these look urgent, but they are worth discussing at a routine appointment.');
      top.forEach((f) => refs.push(...f.evidence));
      break;
    }
    case 'repeat': {
      const t = model.healthInsights.followUpTests;
      if (!t.length) { say(`Nothing in ${name}'s results points to a specific follow-up test. Routine checks as a clinician recommends are enough.`); break; }
      say(`Questions or tests to discuss with a healthcare professional, based on ${name}'s results:`);
      bullets(t.map((x) => `**${x.test}**, related to ${x.reasons.join('; ').toLowerCase()}`));
      say('These are suggestions to discuss, not medical orders.');
      break;
    }
    case 'week': {
      const top = model.foodRecommendations.top10.slice(0, 5);
      if (top.length) {
        say(`For ${name}, these five foods give the most support for the current results and food preferences:`);
        bullets(top.map((f) => `**${f.name}** (${f.serving}, ${f.frequency.toLowerCase()}): ${f.reason}`));
      }
      const today = model.mealPlans[0];
      if (today) {
        say('Today could look like:');
        bullets(today.meals.filter((x) => x.main).map((x) => `**${x.slot}:** ${x.main.text}`));
      }
      say('The Meal Plan tab has the full week, with a different option each day.');
      break;
    }
    case 'score': {
      const s = model.healthInsights.score;
      say(`${name}'s Wellness Snapshot Score is ${s.total ?? 'not available'} (${s.band}), based on ${s.coverage} of ${s.of} areas with data. It is a simple summary, not a medical assessment.`);
      bullets(s.areas.map((a) => `${a.name}: ${a.score ?? 'no data'}`));
      break;
    }
    case 'progress': {
      if (!model.progress.length) {
        say(`There is nothing to compare yet for ${name}: either there is only one report, or every result is in range on both reports.`);
        break;
      }
      say(`What changed for ${name} since the previous report:`);
      bullets(model.progress.map((p) => p.text));
      refs.push(...model.progress.map((p) => p.rec));
      break;
    }
    case 'trend': {
      const targets = present.length ? present.map((id) => recs[id]) : model.labRecords.filter((r) => r.severity !== 'ok' && r.severity !== 'na');
      const withHist = targets.filter((r) => r.history.length > 1 || r.previous_value != null);
      if (!withHist.length) {
        say(`Only one measurement is on file for ${present.length ? targets.map((r) => r.test_name).join(', ') : `${name}'s results`} (${model.latestDate}). Baseline measurement — additional results are needed to establish a trend.`);
      } else {
        bullets(withHist.map((r) => `**${r.test_name}:** ${r.previous_value} → ${r.value} ${r.unit} (${r.trend}${r.quality ? `, ${r.quality}` : ''})`));
      }
      refs.push(...targets);
      break;
    }
    case 'foods':
    case 'improve': {
      const targets = present.map((id) => recs[id]);
      for (const r of targets.slice(0, 3)) {
        const m = MARKER_BY_ID[r.marker_id];
        const need = NEED_OF_MARKER[r.marker_id];
        say(`**${r.test_name}** is ${r.value} ${r.unit}, ${statusWord(r)} (${r.range_text}).${r.status === 'IN RANGE' && r.severity === 'ok' ? ' It is already in range; these habits help keep it there.' : r.severity_note && r.status === 'IN RANGE' ? ' ' + r.severity_note : ''}`);
        if (need) {
          const foods = foodsForNeed(need, model.preferences);
          if (foods.length) bullets(foods.map((f) => `**${f.name}** (${f.serving}): ${f.facts.join(', ') || f.reason}`));
          else if (m?.nutrition && m.nutrition !== '—') say(`Nutrition: ${m.nutrition}`);
          else say('None of the foods in the library match both this result and the selected food preferences.');
        } else if (m?.nutrition && m.nutrition !== '—') say(`Nutrition: ${m.nutrition}`);
        if (intent === 'improve' && m?.lifestyle && m.lifestyle !== '—') say(`Lifestyle: ${m.lifestyle}`);
        refs.push(r);
      }
      if (!targets.length) {
        const top = model.foodRecommendations.top10.slice(0, 6);
        say(`Foods with the most support for ${name}'s current results:`);
        bullets(top.map((f) => `**${f.name}**: supports ${f.supportsAreas.join(', ').toLowerCase()}`));
      }
      say('Food supports health but does not replace medical care.');
      break;
    }
    case 'why':
    case 'status': {
      for (const r of present.map((id) => recs[id]).slice(0, 4)) {
        const m = MARKER_BY_ID[r.marker_id];
        if (r.status === 'NOT REPORTED' || r.status === 'NOT AVAILABLE') { say(`**${r.test_name}:** ${r.status === 'NOT REPORTED' ? 'Not reported' : 'Not available'} in ${name}'s report.`); continue; }
        const yesNo = /^\s*(is|are) (my|it|the)\b.*\b(high|low|normal|ok|okay|fine|good)\b/.test(q)
          ? (/\bhigh\b/.test(q) ? (r.status === 'HIGH' ? 'Yes. ' : 'No. ') : /\blow\b/.test(q) ? (r.status === 'LOW' ? 'Yes. ' : 'No. ') : (r.status === 'IN RANGE' ? 'Yes. ' : 'Not quite. '))
          : '';
        say(`${yesNo}**${r.test_name}** is ${r.value}${r.unit ? ' ' + r.unit : ''}, ${statusWord(r)} (${r.range_text}). ${r.severity_note && r.severity !== 'ok' ? r.severity_note : ''}`.trim());
        if (intent === 'why' || r.status !== 'IN RANGE') {
          const f = findings.find((x) => x.evidence.some((e) => e.marker_id === r.marker_id));
          const cause = r.status === 'HIGH' ? m?.high : r.status === 'LOW' ? m?.low : null;
          if (intent === 'why' && r.status === 'IN RANGE') say(`It is not out of range. ${m?.what || ''}`);
          else if (cause) say(`What this can be associated with: ${cause} The records alone cannot say which applies to ${name}.`);
          if (f) say(`Related: ${f.whyMatters}`);
        }
        if (m?.caution) say(m.caution);
        refs.push(r);
      }
      if (missing.length) say(`Not in ${name}'s uploaded results: ${missing.map((id) => MARKER_BY_ID[id]?.short || id).join(', ')}.`);
      if (present.some((id) => recs[id].status !== 'IN RANGE')) say('Consider discussing this with a healthcare professional.');
      break;
    }
    default:
      say(`I can answer questions about ${name}'s uploaded results. Try asking about a specific test (for example "Is my HbA1c high?"), foods for a result, what needs attention, or which labs to repeat.`);
  }
  return { blocks, refs: [...new Map(refs.map((r) => [r.marker_id, r])).values()] };
}

export const SAMPLE_QUESTIONS = [
  'Which results should I worry about?',
  'Why is my vitamin D low?',
  'Is my HbA1c high?',
  'What foods should I eat for low B12?',
  'How can I improve HDL?',
  'Why is MCV low?',
  'What should I eat this week?',
  'Which labs should I repeat?',
  'What changed since my last report?',
];
