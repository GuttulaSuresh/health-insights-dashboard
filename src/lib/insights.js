// Rule-based insights computed from a single profile's normalized records.
// Findings -> focus areas -> goals -> follow-up tests -> wellness score.
import { MARKER_BY_ID, SEVERITY_RANK } from './normalize.js';
import { CATEGORIES } from '../content/markers.js';

const maxSev = (...levels) => levels.filter(Boolean).reduce((a, b) => (SEVERITY_RANK[b] > SEVERITY_RANK[a] ? b : a), 'ok');
const isAbn = (r) => r && (r.severity === 'watch' || r.severity === 'attention' || r.severity === 'priority');
export const fmt = (r) => (r ? `${r.test_name} ${r.value}${r.unit ? ' ' + r.unit : ''}` : '');
export const val = (r) => (r ? `${r.value}${r.unit ? ' ' + r.unit : ''}` : '');
export const fmtR = (r) => (r ? `${fmt(r)} (lab range ${r.range_text})` : '');
const list = (arr) => (arr.length <= 1 ? arr.join('') : `${arr.slice(0, -1).join(', ')} and ${arr[arr.length - 1]}`);

export const LEVEL_TEXT = {
  watch: 'Mildly abnormal',
  attention: 'Moderately concerning',
  priority: 'Important to discuss soon',
};

/** Index of latest record per marker id. */
export function indexRecords(records) {
  return Object.fromEntries(records.map((r) => [r.marker_id, r]));
}

// Findings ("What Needs Attention"). Each pattern looks at related labs together.
// `needs` drive the food engine: weight comes from the finding's severity.
const PATTERNS = [
  {
    id: 'glycemic', area: 'Blood sugar', markers: ['hba1c', 'fasting_glucose', 'eag', 'insulin'],
    build(m) {
      const a1c = m.hba1c, fg = m.fasting_glucose;
      if (!isAbn(a1c) && !isAbn(fg)) return null;
      const sev = maxSev(a1c?.severity, fg?.severity);
      const both = isAbn(a1c) && isAbn(fg);
      const vals = [a1c && fmtR(a1c), fg && fmtR(fg)].filter(Boolean);
      let band = '';
      if (a1c && typeof a1c.value === 'number') {
        if (a1c.value >= 6.5) band = 'An HbA1c of 6.5% or higher may be associated with diabetes. Clinicians usually confirm it with repeat testing and consider the whole picture before drawing any conclusion.';
        else if (a1c.value >= 5.7) band = 'An HbA1c of 5.7–6.4% is commonly described as the prediabetes range, a stage where lifestyle changes can make a real difference.';
      }
      const tgHigh = isAbn(m.triglycerides);
      return {
        title: both ? 'Blood sugar is above range on two tests' : `${(isAbn(a1c) ? a1c : fg).test_name} is above range`,
        severity: sev,
        measures: 'HbA1c reflects average blood sugar over roughly the past 3 months. Fasting glucose is a single reading after not eating overnight.',
        meaning: `${list(vals)}. ${band}`.trim(),
        whyMatters: `Higher blood sugar over time may affect the heart, kidneys, eyes and nerves. ${tgHigh ? 'High triglycerides often travel with higher blood sugar, so the two are worth addressing together. ' : ''}Finding it early gives the most room to act.`,
        nutrition: [
          'Swap sugary drinks and juice for water, sparkling water or unsweetened tea.',
          'Fill half the plate with non-starchy vegetables; keep rice, roti or bread to about a quarter.',
          'Add protein and fiber (dal, beans, eggs, fish, tofu) to every meal to slow the sugar rise.',
          'Choose whole grains and millets over white rice, maida and white bread.',
        ],
        lifestyle: ['A 10–15 minute walk after meals.', 'About 150 minutes a week of activity plus strength exercise twice a week.', '7–9 hours of sleep.', 'Weight management, if your clinician thinks it is appropriate.'],
        followUp: [
          a1c?.value >= 6.5 ? 'Repeat HbA1c or confirmation testing, as your clinician advises' : 'Repeat HbA1c and fasting glucose',
          ...(a1c?.value >= 6.5 || fg?.value >= 126 ? ['Urine albumin-to-creatinine ratio (early kidney check)', 'Blood pressure check'] : []),
        ],
        confidence: both ? 'High' : 'Moderate',
        needs: ['glycemic'],
        related: ['triglycerides', 'hdl', 'egfr'],
      };
    },
  },
  {
    id: 'triglycerides', area: 'Cholesterol & heart', markers: ['triglycerides'],
    build(m) {
      const tg = m.triglycerides;
      if (!isAbn(tg)) return null;
      const glyc = isAbn(m.hba1c) || isAbn(m.fasting_glucose);
      const fasting = /fasting:\s*yes/i.test(tg.notes);
      return {
        title: 'Triglycerides are high',
        severity: tg.severity,
        measures: 'Triglycerides are a type of fat in the blood. The liver makes more of them from extra sugar, refined carbs and alcohol.',
        meaning: `${fmtR(tg)}${fasting ? ', measured fasting, so a recent meal does not explain it' : ''}. That is about ${(tg.value / tg.reference_high).toFixed(1)} times the upper limit.`,
        whyMatters: `High triglycerides can be associated with heart and blood-vessel risk${glyc ? ' and often rise together with blood sugar, which is also above range' : ''}. ${tg.value >= 500 ? 'Very high levels can also affect the pancreas, so discuss this soon.' : ''}`.trim(),
        nutrition: ['Cut sweet drinks, sweets and juice first; they raise triglycerides fastest.', 'Reduce refined carbs and portion sizes of rice and bread.', 'Eat fatty fish twice a week, or walnuts and ground flax daily if vegetarian.', 'Limit alcohol (if you drink).'],
        lifestyle: ['Regular aerobic activity.', 'Weight management, if appropriate.'],
        followUp: ['Repeat lipid panel'],
        confidence: 'High',
        needs: ['triglycerides'],
        related: ['hba1c', 'hdl', 'non_hdl'],
      };
    },
  },
  {
    id: 'atherogenic', area: 'Cholesterol & heart', markers: ['ldl', 'non_hdl', 'total_cholesterol', 'chol_hdl_ratio', 'apob'],
    build(m) {
      const ids = ['ldl', 'non_hdl', 'total_cholesterol', 'chol_hdl_ratio', 'apob'].filter((k) => isAbn(m[k]));
      if (!ids.length) return null;
      const sev = maxSev(...ids.map((k) => m[k].severity));
      const ldlCalc = m.ldl && /calc|martin|friedewald/i.test(m.ldl.original_name) && m.triglycerides?.value >= 200;
      return {
        title: ids.length > 1 ? 'LDL and related cholesterol numbers are above range' : `${m[ids[0]].test_name} is above range`,
        severity: sev,
        measures: 'LDL and non-HDL cholesterol count the cholesterol carriers that can build up in artery walls.',
        meaning: `${list(ids.map((k) => fmtR(m[k])))}.${m.hdl ? ` HDL is ${m.hdl.value} (${m.hdl.status === 'IN RANGE' ? 'in range' : 'below range'}).` : ''}${ldlCalc ? ' Because triglycerides are high, the calculated LDL is less precise; non-HDL is the steadier number here.' : ''}`,
        whyMatters: `Raised LDL and non-HDL can be associated with higher long-term heart risk${isAbn(m.hba1c) ? ', especially together with higher blood sugar' : ''}.`,
        nutrition: ['Use olive, canola or peanut oil instead of butter, ghee or coconut oil most days.', 'Oats or barley most days (soluble fiber called beta-glucan).', 'Beans, lentils, nuts and soy foods several times a week.', 'Fewer fried foods, fatty red meat and processed meats.'],
        lifestyle: ['Regular activity.', 'Not smoking.', 'Weight management, if appropriate.'],
        followUp: ['Repeat lipid panel', ...(!m.apob ? ['ApoB (counts cholesterol particles directly)'] : []), ...(!m.lpa ? ['Lipoprotein(a), usually checked once'] : [])],
        confidence: ldlCalc ? 'Moderate' : 'High',
        needs: ['ldl'],
        related: ['hdl', 'triglycerides'],
      };
    },
  },
  {
    id: 'hdl', area: 'Cholesterol & heart', markers: ['hdl'],
    build(m) {
      const h = m.hdl;
      if (!isAbn(h)) return null;
      const others = ['ldl', 'triglycerides', 'non_hdl', 'total_cholesterol'].filter((k) => m[k]);
      const othersOk = others.every((k) => !isAbn(m[k]));
      return {
        title: 'HDL ("good") cholesterol is below range',
        severity: h.severity,
        measures: 'HDL carries cholesterol away from the arteries back to the liver.',
        meaning: `${fmtR(h)}.${othersOk && others.length ? ` The rest of the lipid panel is in range (${list(others.map((k) => fmt(m[k])))}), which is favorable.` : ''}`,
        whyMatters: 'Low HDL on its own is a mild risk factor for heart disease. It responds well to regular exercise.',
        nutrition: ['Healthy fats: olive oil, nuts, seeds, avocado, fatty fish.', 'Fewer refined carbs and fried or packaged snacks (trans fats lower HDL).'],
        lifestyle: ['Regular aerobic exercise is the most reliable way to raise HDL (about 150 minutes a week).', 'Not smoking.'],
        followUp: ['Repeat lipid panel'],
        confidence: 'High',
        needs: ['hdl'],
        related: ['ldl', 'triglycerides'],
      };
    },
  },
  {
    id: 'microcytic', area: 'Red blood cells & iron', markers: ['mcv', 'mch', 'mchc', 'hemoglobin', 'rdw'],
    build(m) {
      const small = ['mcv', 'mch'].filter((k) => m[k]?.status === 'LOW');
      if (!small.length) return null;
      let sev = maxSev(...small.map((k) => m[k].severity));
      if (small.length === 2 || m.hemoglobin?.status === 'LOW') sev = maxSev(sev, 'attention');
      const hasIron = m.ferritin || m.iron || m.iron_saturation;
      const ferritinLow = m.ferritin?.status === 'LOW';
      let ironText;
      if (!hasIron) ironText = 'Iron studies (ferritin, iron, TIBC) were not part of these results, so the cause cannot be narrowed down yet.';
      else if (ferritinLow) ironText = `Ferritin is low (${val(m.ferritin)}), which fits with low iron stores.`;
      else ironText = `Iron studies are available${m.ferritin ? ` and ferritin is ${val(m.ferritin)}` : ''}; your clinician can interpret them together.`;
      return {
        title: 'Red blood cells are smaller than expected',
        severity: sev,
        measures: 'MCV is the average size of red blood cells; MCH is how much hemoglobin each cell carries.',
        meaning: `${list(small.map((k) => fmtR(m[k])))}. Smaller cells are called microcytosis. ${m.hemoglobin ? `Hemoglobin is ${val(m.hemoglobin)} (${m.hemoglobin.status === 'IN RANGE' ? 'in range' : m.hemoglobin.status.toLowerCase()}).` : ''} ${ironText}`,
        whyMatters: 'This pattern can sometimes be seen before anemia shows up. It is most often associated with low iron stores, and it can also occur with inherited traits such as thalassemia trait, which is common and usually harmless.',
        nutrition: ['Iron-rich foods: lentils, chickpeas, rajma, leafy greens, pumpkin seeds; eggs, fish or poultry if you eat them.', 'Pair iron foods with vitamin C (lemon, guava, orange, amla).', 'Keep tea and coffee at least an hour away from meals.'],
        lifestyle: ['Note tiredness, breathlessness on stairs or heavy periods to mention to your clinician.'],
        followUp: hasIron ? ['Repeat CBC'] : ['Ferritin', 'Iron, TIBC and iron saturation', 'Hemoglobin electrophoresis if iron studies are normal'],
        confidence: hasIron ? 'Moderate' : 'Low',
        needs: ['iron'],
        related: ['hemoglobin', 'rdw', 'ferritin', 'vitamin_b12', 'folate'],
      };
    },
  },
  {
    id: 'iron', area: 'Red blood cells & iron', markers: ['ferritin', 'iron', 'iron_saturation', 'tibc'],
    build(m, found) {
      const ids = ['ferritin', 'iron', 'iron_saturation', 'tibc'].filter((k) => isAbn(m[k]));
      if (!ids.length || found.some((f) => f.id === 'microcytic')) return null;
      const ferrOk = m.ferritin?.status === 'IN RANGE';
      const hasCBC = m.hemoglobin || m.mcv;
      return {
        title: ids.length === 1 ? `${m[ids[0]].test_name} is ${m[ids[0]].status === 'LOW' ? 'slightly low' : 'outside range'}` : 'Iron studies are outside range',
        severity: maxSev(...ids.map((k) => m[k].severity)),
        measures: 'Iron studies show how much iron is circulating (iron, saturation) and stored (ferritin).',
        meaning: `${list(ids.map((k) => fmtR(m[k])))}.${ferrOk ? ` Ferritin, the stored-iron marker, is in range (${val(m.ferritin)}), which makes low iron stores less likely.` : ''}`,
        whyMatters: `${ferrOk ? 'A small dip in saturation with normal ferritin often reflects day-to-day variation and may not mean much on its own.' : 'This may suggest less iron is available for making red blood cells.'}${hasCBC ? '' : ' No blood count (CBC) is on file to show whether red cells are affected.'}`,
        nutrition: ['Iron-rich foods paired with vitamin C.', 'Tea and coffee away from meals.'],
        lifestyle: [],
        followUp: [...(hasCBC ? [] : ['CBC (complete blood count)']), 'Repeat iron studies'],
        confidence: 'Low',
        needs: ['iron'],
        related: ['ferritin', 'iron', 'tibc', 'iron_saturation'],
      };
    },
  },
  {
    id: 'vitd', area: 'Vitamin D', markers: ['vitamin_d', 'calcium'],
    build(m) {
      const d = m.vitamin_d;
      if (!isAbn(d)) return null;
      return {
        title: 'Vitamin D is low',
        severity: d.severity,
        measures: 'The 25-OH vitamin D test shows your body\'s vitamin D stores.',
        meaning: `${fmtR(d)}. ${d.value < 20 ? 'Below 20 ng/mL is usually called deficiency.' : d.value < 30 ? 'Many labs call 20–29 ng/mL "insufficiency".' : ''}${m.calcium ? ` Calcium is ${val(m.calcium)} (${m.calcium.status === 'IN RANGE' ? 'in range' : m.calcium.status.toLowerCase()}); blood calcium usually stays normal even when vitamin D is low.` : ''}`,
        whyMatters: 'Vitamin D helps the body absorb calcium and supports bones and muscles. Food alone rarely raises a low level much, so a supplement is often discussed.',
        nutrition: ['Fatty fish (salmon, sardines, mackerel) twice a week.', 'Vitamin D-fortified milk, yogurt or soy milk.', 'Eggs (the yolk), UV-exposed mushrooms.'],
        lifestyle: ['Some safe midday sunlight on arms and face a few times a week; avoid sunburn.'],
        followUp: ['Repeat vitamin D after any changes (often after about 3 months)'],
        confidence: 'High',
        needs: ['vitd'],
        related: ['calcium', 'alp'],
      };
    },
  },
  {
    id: 'b12', area: 'Vitamin B12', markers: ['vitamin_b12', 'folate'],
    build(m) {
      const b = m.vitamin_b12;
      if (!isAbn(b)) return null;
      const small = m.mcv?.status === 'LOW';
      return {
        title: b.status === 'LOW' ? 'Vitamin B12 is low' : 'Vitamin B12 is at the low end of the range',
        severity: b.severity,
        measures: 'Vitamin B12 is needed for nerves and for making red blood cells.',
        meaning: `${fmtR(b)}. ${b.status === 'IN RANGE' ? 'It counts as in range, but values of 200–400 pg/mL can sometimes go with a hidden B12 shortage.' : ''}${m.folate ? ` Folate is ${val(m.folate)} (${m.folate.status === 'IN RANGE' ? 'in range' : m.folate.status.toLowerCase()}).` : ''}`,
        whyMatters: `Low B12 can be associated with tiredness, tingling and memory changes, and usually makes red cells larger.${small ? ' Your red cells are small, which points the other way; when low iron and low B12 occur together, the effects can mask each other on a blood count.' : ''}`,
        nutrition: ['Eggs, milk, yogurt, paneer, fish or poultry if you eat them.', 'Vegetarian or vegan: B12-fortified cereals, fortified plant milks or nutritional yeast.'],
        lifestyle: ['Mention tingling, numbness or unusual tiredness to your clinician.', 'Acid-reducing medicines and metformin can lower B12 over time; ask your clinician if this applies to you.'],
        followUp: ['Repeat vitamin B12', 'Methylmalonic acid (MMA) to clarify a borderline B12'],
        confidence: 'Moderate',
        needs: ['b12'],
        related: ['folate', 'mcv'],
      };
    },
  },
  {
    id: 'folate', area: 'Vitamins', markers: ['folate'],
    build(m) {
      const f = m.folate;
      if (!isAbn(f)) return null;
      return {
        title: 'Folate is outside range', severity: f.severity,
        measures: 'Folate is a B vitamin needed for red blood cells.',
        meaning: `${fmtR(f)}.`, whyMatters: 'Low folate can be associated with larger red cells and tiredness.',
        nutrition: ['Leafy greens, lentils, chickpeas, citrus.'], lifestyle: ['Limit alcohol.'],
        followUp: ['Repeat folate and CBC'], confidence: 'Moderate', needs: ['folate'], related: ['vitamin_b12', 'mcv'],
      };
    },
  },
  {
    id: 'liver_high', area: 'Liver', markers: ['alt', 'ast', 'alp', 'ggt', 'bilirubin_total'],
    build(m) {
      const ids = ['alt', 'ast', 'alp', 'ggt', 'bilirubin_total'].filter((k) => m[k]?.status === 'HIGH');
      if (!ids.length) return null;
      return {
        title: 'Some liver tests are above range', severity: maxSev(...ids.map((k) => m[k].severity)),
        measures: 'Liver enzymes rise when liver cells are irritated.',
        meaning: `${list(ids.map((k) => fmtR(m[k])))}.`,
        whyMatters: 'Raised liver enzymes can be associated with fatty liver, alcohol, medicines or supplements, or infection.',
        nutrition: ['Limit sugar, refined carbs and alcohol.'], lifestyle: ['Weight management, if appropriate.', 'Review medicines and supplements with your clinician.'],
        followUp: ['Repeat liver panel'], confidence: 'Moderate', needs: ['liver'], related: [],
      };
    },
  },
  {
    id: 'ast_low', area: 'Liver', markers: ['ast', 'alt'],
    build(m) {
      const a = m.ast;
      if (a?.status !== 'LOW') return null;
      const othersOk = ['alt', 'alp', 'bilirubin_total', 'albumin'].filter((k) => m[k]).every((k) => m[k].status === 'IN RANGE');
      return {
        title: 'AST is slightly below range', severity: 'watch', lowConcern: true,
        measures: 'AST is an enzyme found in the liver and muscles.',
        meaning: `${fmtR(a)}.${othersOk ? ' The other liver tests are in range.' : ''}`,
        whyMatters: 'Liver enzymes mainly matter when they are high. A low AST is generally not considered meaningful on its own; it is sometimes seen with low vitamin B6.',
        nutrition: ['A balanced diet with whole grains, legumes and vegetables covers B6.'], lifestyle: [],
        followUp: [], confidence: 'High', needs: [], related: ['alt'],
      };
    },
  },
  {
    id: 'kidney', area: 'Kidney', markers: ['egfr', 'creatinine', 'bun', 'urine_albumin'],
    build(m) {
      const ids = [m.egfr?.status === 'LOW' && 'egfr', m.creatinine?.status === 'HIGH' && 'creatinine', m.bun?.status === 'HIGH' && 'bun', isAbn(m.urine_albumin) && 'urine_albumin'].filter(Boolean);
      if (!ids.length) return null;
      return {
        title: 'Kidney markers are outside range', severity: maxSev(...ids.map((k) => m[k].severity)),
        measures: 'These tests estimate how well the kidneys filter the blood.',
        meaning: `${list(ids.map((k) => fmtR(m[k])))}.`,
        whyMatters: 'Can be associated with dehydration or reduced kidney filtering; a repeat test helps clarify.',
        nutrition: ['Moderate salt; stay hydrated.'], lifestyle: ['Blood pressure and blood sugar control protect the kidneys.'],
        followUp: ['Repeat kidney panel', 'Urine albumin-to-creatinine ratio'], confidence: 'Moderate', needs: ['kidney'], related: [],
      };
    },
  },
  {
    id: 'thyroid', area: 'Thyroid', markers: ['tsh', 'free_t4', 'free_t3'],
    build(m) {
      const ids = ['tsh', 'free_t4', 'free_t3'].filter((k) => isAbn(m[k]));
      if (!ids.length) return null;
      return {
        title: 'Thyroid tests are outside range', severity: maxSev(...ids.map((k) => m[k].severity)),
        measures: 'TSH and Free T4 show how the thyroid is working.', meaning: `${list(ids.map((k) => fmtR(m[k])))}.`,
        whyMatters: 'Can be associated with an underactive or overactive thyroid; usually confirmed with repeat testing.',
        nutrition: ['Use iodized salt; avoid high-dose iodine or biotin supplements before testing.'], lifestyle: [],
        followUp: ['Repeat TSH and Free T4', 'Thyroid antibodies if TSH stays abnormal'], confidence: 'Moderate', needs: [], related: [],
      };
    },
  },
];

export function buildFindings(records) {
  const m = indexRecords(records);
  const found = [];
  const covered = new Set();
  for (const p of PATTERNS) {
    const f = p.build(m, found);
    if (!f) continue;
    const markers = p.markers.filter((k) => m[k]);
    markers.forEach((k) => { if (isAbn(m[k])) covered.add(k); });
    found.push({
      id: p.id,
      area: p.area,
      ...f,
      level: f.lowConcern ? 'Mildly abnormal (usually low concern)' : LEVEL_TEXT[f.severity],
      markers,
      evidence: markers.filter((k) => isAbn(m[k])).map((k) => m[k]),
      relatedRecords: (f.related || []).map((k) => m[k]).filter(Boolean),
    });
  }
  // Anything abnormal that no pattern explained gets a generic, catalog-based finding.
  for (const r of records) {
    if (!isAbn(r) || covered.has(r.marker_id)) continue;
    const cat = MARKER_BY_ID[r.marker_id];
    found.push({
      id: `generic_${r.marker_id}`,
      area: CATEGORIES.find((c) => c.id === r.category)?.name || 'Other',
      title: `${r.test_name} is ${r.status === 'HIGH' ? 'above' : r.status === 'LOW' ? 'below' : 'near the edge of'} range`,
      severity: r.severity,
      level: LEVEL_TEXT[r.severity],
      measures: cat?.what || 'See your report for details about this test.',
      meaning: `${fmtR(r)}. ${r.severity_note || ''}`.trim(),
      whyMatters: (r.status === 'HIGH' ? cat?.high : cat?.low) || 'Discuss what this result means with a healthcare professional.',
      nutrition: cat?.nutrition && cat.nutrition !== '—' ? [cat.nutrition] : [],
      lifestyle: cat?.lifestyle && cat.lifestyle !== '—' ? [cat.lifestyle] : [],
      followUp: cat?.followUp || [],
      confidence: 'Moderate',
      needs: [],
      markers: [r.marker_id],
      evidence: [r],
      relatedRecords: [],
    });
  }
  found.sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity] || (a.lowConcern ? 1 : 0) - (b.lowConcern ? 1 : 0));
  return found;
}

// Needs: what the food engine should support, with weights 1 (watch) .. 3 (priority).
const W = { watch: 1, attention: 2, priority: 3 };
export function buildNeeds(findings) {
  const needs = {};
  const evidence = {};
  for (const f of findings) {
    for (const n of f.needs || []) {
      needs[n] = Math.max(needs[n] || 0, W[f.severity] || 0);
      evidence[n] = [...(evidence[n] || []), ...f.evidence];
    }
  }
  return { weights: needs, evidence };
}

// Wellness Snapshot Score (transparent, not a diagnosis)
export const SCORE_AREAS = [
  { id: 'glucose', name: 'Blood sugar', cats: ['glucose'] },
  { id: 'lipids', name: 'Cardiovascular markers', cats: ['lipids'] },
  { id: 'vitamins', name: 'Vitamins & minerals', cats: ['vitamins', 'iron'] },
  { id: 'kidney', name: 'Kidney health', cats: ['kidney', 'electrolytes'] },
  { id: 'liver', name: 'Liver health', cats: ['liver'] },
  { id: 'cbc', name: 'Blood count', cats: ['cbc'] },
  { id: 'thyroid', name: 'Thyroid', cats: ['thyroid'] },
];
export const PENALTY = { ok: 0, watch: 8, attention: 20, priority: 45, na: 0 };

export function buildScore(records) {
  const areas = SCORE_AREAS.map((a) => {
    const recs = records.filter((r) => a.cats.includes(r.category) && r.severity !== 'na');
    if (!recs.length) return { ...a, score: null, recs: [], detail: 'No results in this area, so it is left out of the score.' };
    const pens = recs.map((r) => PENALTY[r.severity]).sort((x, y) => y - x);
    const [top = 0, ...rest] = pens;
    const restSum = rest.reduce((s, x) => s + x, 0);
    const score = Math.max(0, Math.round(100 - top - 0.25 * restSum));
    const flagged = recs.filter((r) => r.severity !== 'ok');
    return {
      ...a, score, recs, flagged,
      detail: flagged.length
        ? `100 − ${top} for the most significant result${rest.some((x) => x) ? ` − ¼ of ${restSum} for the others` : ''}.`
        : 'All results in this area are in range.',
    };
  });
  const scored = areas.filter((a) => a.score !== null);
  const total = scored.length ? Math.round(scored.reduce((s, a) => s + a.score, 0) / scored.length) : null;
  const hasPriority = records.some((r) => r.severity === 'priority');
  const band = total === null ? 'Not enough data'
    : hasPriority ? 'Includes a high-priority result'
    : total >= 85 ? 'Mostly in range' : total >= 70 ? 'Some areas to work on' : 'Several areas need attention';
  return { total, band, hasPriority, areas, coverage: scored.length, of: SCORE_AREAS.length };
}

// Category status (for overview tiles)
export function categoryStatus(records) {
  return CATEGORIES.map((c) => {
    const recs = records.filter((r) => r.category === c.id);
    const sev = recs.length ? maxSev(...recs.map((r) => r.severity)) : 'na';
    const flagged = recs.filter((r) => isAbn(r));
    return { ...c, recs, severity: recs.length && recs.every((r) => r.severity === 'na') ? 'na' : sev, flagged };
  }).filter((c) => c.recs.length);
}

// Health goals (3–5) generated from findings
const GOAL_TEMPLATES = {
  glycemic: { title: 'Improve blood sugar control', activity: ['Walk 10–15 minutes after lunch and dinner.', 'Build up to about 150 minutes a week, plus strength exercise twice a week.'], sleep: ['Aim for 7–9 hours; short sleep is linked to higher blood sugar.'], weight: true },
  lipids: { title: 'Improve lipid profile', activity: ['Regular aerobic activity most days.'], sleep: ['Consistent sleep supports healthier eating and activity.'], weight: true },
  hdl: { title: 'Raise HDL ("good") cholesterol', activity: ['Aerobic exercise (brisk walking, cycling, dancing), about 150 minutes a week.'], sleep: [], weight: false },
  redcells: { title: 'Support healthy red blood cells and iron', activity: ['Keep active as energy allows; note unusual tiredness or breathlessness.'], sleep: [], weight: false },
  vitd: { title: 'Raise vitamin D', activity: ['Outdoor activity in daylight a few times a week.'], sleep: [], weight: false },
  b12: { title: 'Keep vitamin B12 in a healthy range', activity: [], sleep: [], weight: false },
  other: { title: 'Follow up on other results', activity: [], sleep: [], weight: false },
};
const GOAL_OF = { glycemic: 'glycemic', triglycerides: 'lipids', atherogenic: 'lipids', hdl: 'hdl', microcytic: 'redcells', iron: 'redcells', vitd: 'vitd', b12: 'b12', folate: 'b12' };

export function buildGoals(findings) {
  const groups = new Map();
  for (const f of findings) {
    if (f.lowConcern) continue;
    let key = GOAL_OF[f.id] || 'other';
    if (key === 'hdl' && findings.some((x) => x.id === 'triglycerides' || x.id === 'atherogenic')) key = 'lipids';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(f);
  }
  const goals = [...groups.entries()].map(([key, fs]) => {
    const t = GOAL_TEMPLATES[key];
    const sev = maxSev(...fs.map((f) => f.severity));
    const weightRelevant = t.weight;
    return {
      key, title: key === 'other' ? `Follow up on ${list(fs.map((f) => f.evidence[0]?.test_name).filter(Boolean))}` : t.title,
      severity: sev,
      why: fs.map((f) => ({ title: f.title, text: f.meaning, evidence: f.evidence })),
      actions: {
        Nutrition: [...new Set(fs.flatMap((f) => f.nutrition))].slice(0, 4),
        Activity: t.activity.length ? t.activity : [...new Set(fs.flatMap((f) => f.lifestyle))].slice(0, 2),
        Sleep: t.sleep,
        'Weight management': weightRelevant ? ['If your clinician feels it is appropriate, even modest weight loss (5–7%) can improve blood sugar and triglycerides.'] : [],
        'Follow-up testing': [...new Set(fs.flatMap((f) => f.followUp))],
      },
    };
  });
  goals.sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity]);
  if (goals.length < 3) {
    goals.push({
      key: 'maintain', title: 'Maintain what is going well', severity: 'ok',
      why: [{ title: 'Many results are in range', text: 'Keeping current habits helps these stay healthy.', evidence: [] }],
      actions: { Nutrition: ['Keep a varied diet with vegetables, legumes, whole grains and fruit.'], Activity: ['Stay active most days.'], Sleep: ['7–9 hours of sleep.'], 'Weight management': [], 'Follow-up testing': ['Routine labs as your clinician recommends.'] },
    });
  }
  return goals.slice(0, 5);
}

// Tests to discuss at the next appointment (only tests linked to existing findings)
export function buildFollowUpTests(findings) {
  const map = new Map();
  for (const f of findings) {
    for (const t of f.followUp || []) {
      if (!map.has(t)) map.set(t, { test: t, reasons: [], severity: f.severity });
      const e = map.get(t);
      e.reasons.push(f.title);
      if (SEVERITY_RANK[f.severity] > SEVERITY_RANK[e.severity]) e.severity = f.severity;
    }
  }
  return [...map.values()].sort((a, b) => SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity]);
}

export function buildQuestions(findings, records) {
  const qs = [];
  const m = indexRecords(records);
  for (const f of findings) for (const r of f.evidence) for (const q of MARKER_BY_ID[r.marker_id]?.questions || []) qs.push(q);
  if (m.amh) qs.push(...MARKER_BY_ID.amh.questions);
  if (m.h_pylori_ubt) qs.push(...MARKER_BY_ID.h_pylori_ubt.questions);
  return [...new Set(qs)].slice(0, 10);
}

const AREA_NAME = { cbc: 'Blood count', glucose: 'Blood sugar', lipids: 'Cholesterol', kidney: 'Kidney', liver: 'Liver', thyroid: 'Thyroid', vitamins: 'Vitamins', iron: 'Iron', electrolytes: 'Electrolytes' };

export function overviewSummary(profile, records, findings) {
  const normal = records.filter((r) => r.severity === 'ok').length;
  const reported = records.filter((r) => r.severity !== 'na').length;
  const pri = findings.filter((f) => f.severity === 'priority');
  const att = findings.filter((f) => f.severity === 'attention');
  const okAreas = categoryStatus(records).filter((c) => c.severity === 'ok' && !['hormonal', 'other'].includes(c.id)).map((c) => AREA_NAME[c.id]);
  let s = `${normal} of ${reported} reported results for ${profile.name} are within the lab's range.`;
  if (okAreas.length) s += ` ${list(okAreas)} ${okAreas.length > 1 ? 'look' : 'looks'} good.`;
  const areas = (fs) => [...new Set(fs.map((f) => f.area))];
  if (pri.length) s += ` Important to review with a healthcare professional soon: ${list(areas(pri))}.`;
  const attAreas = areas(att).filter((a) => !areas(pri).includes(a));
  if (attAreas.length) s += ` ${pri.length ? 'Also needing attention' : 'Needing attention'}: ${list(attAreas)}.`;
  if (!pri.length && !att.length && findings.length) s += ' The flagged results are mild.';
  if (!pri.length) s += ' Nothing here looks urgent.';
  return s;
}
