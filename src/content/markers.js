// Marker catalog: one entry per underlying lab marker.
// - `aliases` let different report spellings ("HDL", "HDL cholesterol") map to the same marker.
// - `rule` (optional) adds clinically-informed severity on top of the lab's own range.
//   It never decides HIGH/LOW; that always comes from the lab reference range (see computeStatus in lib/normalize.js).
// - Text is educational. It uses "may", "can be associated with", never a diagnosis.

export const CATEGORIES = [
  { id: 'cbc', name: 'Blood / CBC', icon: '🩸' },
  { id: 'glucose', name: 'Diabetes / Glucose', icon: '🍬' },
  { id: 'lipids', name: 'Cholesterol / Cardiovascular', icon: '❤️' },
  { id: 'kidney', name: 'Kidney', icon: '🫘' },
  { id: 'liver', name: 'Liver', icon: '🫀' },
  { id: 'thyroid', name: 'Thyroid', icon: '🦋' },
  { id: 'vitamins', name: 'Vitamins / Minerals', icon: '☀️' },
  { id: 'iron', name: 'Iron', icon: '🧲' },
  { id: 'electrolytes', name: 'Electrolytes', icon: '⚡' },
  { id: 'hormonal', name: 'Hormonal / Reproductive', icon: '🧬' },
  { id: 'other', name: 'Other Tests', icon: '🧪' },
];

// Maps category names used in uploaded files to our category ids (fallback when a marker is unknown).
export const FILE_CATEGORY_MAP = {
  'blood/cbc': 'cbc', 'cbc': 'cbc', 'blood': 'cbc',
  'diabetes/glucose': 'glucose', 'glucose': 'glucose',
  'cholesterol/cardiovascular': 'lipids', 'lipids': 'lipids', 'cardiovascular': 'lipids',
  'kidney': 'kidney', 'renal': 'kidney',
  'liver': 'liver',
  'thyroid': 'thyroid',
  'vitamins/minerals': 'vitamins', 'vitamins': 'vitamins', 'minerals': 'vitamins',
  'iron': 'iron',
  'electrolytes': 'electrolytes',
  'hormonal/reproductive': 'hormonal', 'hormonal': 'hormonal',
  'other tests': 'other', 'other': 'other',
};

const lv = (level, note) => ({ level, note });

export const MARKERS = [
  // Blood / CBC
  {
    id: 'wbc', name: 'White blood cells (WBC)', short: 'WBC', category: 'cbc',
    aliases: ['wbc', 'white blood cell count', 'white blood cells', 'leukocytes'],
    what: 'Counts the white blood cells, which fight infection.',
    why: 'Part of a routine blood count to screen for infection, inflammation and bone-marrow health.',
    high: 'Can be seen with infection, inflammation, stress, smoking or some medicines.',
    low: 'Can be seen with some viral infections, certain medicines, or nutrient shortages; mild lows are common and often harmless.',
    nutrition: 'A varied diet with enough protein, folate, B12 and zinc supports normal blood-cell production.',
    lifestyle: 'Sleep, stress management and not smoking support immune health.',
    followUp: ['Repeat CBC with differential if abnormal'],
    questions: ['Is my white cell count in a range that needs any follow-up?'],
  },
  {
    id: 'rbc', name: 'Red blood cells (RBC)', short: 'RBC', category: 'cbc',
    aliases: ['rbc', 'red blood cell count', 'red blood cells', 'erythrocytes'],
    what: 'Counts the red blood cells, which carry oxygen.',
    why: 'Helps check for anemia (too few red cells) or too many red cells.',
    high: 'Can be seen with dehydration, smoking, living at altitude, or some inherited red-cell traits.',
    low: 'Can be associated with anemia from low iron, B12 or folate, or blood loss.',
    nutrition: 'Iron, B12 and folate are needed to make red blood cells.',
    lifestyle: 'Stay hydrated before blood tests; avoid smoking.',
    followUp: ['CBC recheck'],
    questions: ['How do my red cell count and size fit together?'],
  },
  {
    id: 'hemoglobin', name: 'Hemoglobin', short: 'Hemoglobin', category: 'cbc',
    aliases: ['hemoglobin', 'haemoglobin', 'hgb', 'hb'],
    what: 'The oxygen-carrying protein inside red blood cells.',
    why: 'The main number used to check for anemia.',
    high: 'Can be seen with dehydration, smoking or living at high altitude.',
    low: 'Low hemoglobin is called anemia; it can be associated with low iron, B12 or folate, or blood loss.',
    nutrition: 'Iron-rich foods (lentils, greens, meat, fish) with vitamin C help the body make hemoglobin.',
    lifestyle: 'Mention tiredness, breathlessness or heavy periods to your clinician.',
    followUp: ['Ferritin and iron studies if red-cell size is low'],
    questions: ['Is my hemoglobin where you would expect it to be?'],
  },
  {
    id: 'hematocrit', name: 'Hematocrit', short: 'Hematocrit', category: 'cbc',
    aliases: ['hematocrit', 'hct', 'packed cell volume', 'pcv'],
    what: 'The share of your blood volume made up of red blood cells.',
    why: 'Moves together with hemoglobin; used to check for anemia or dehydration.',
    high: 'Can be seen with dehydration or smoking.',
    low: 'Can be associated with anemia.',
    nutrition: 'Same as hemoglobin: iron, B12 and folate support red-cell production.',
    lifestyle: 'Hydration affects this value.',
    followUp: ['CBC recheck'],
    questions: ['Does my hematocrit change anything about my red-cell results?'],
  },
  {
    id: 'mcv', name: 'MCV (average red cell size)', short: 'MCV', category: 'cbc',
    aliases: ['mcv', 'mean corpuscular volume', 'mean cell volume'],
    what: 'The average size of your red blood cells.',
    why: 'Helps sort out possible causes of anemia: small cells point one way, large cells another.',
    high: 'Larger cells (called macrocytosis) can be associated with low B12 or folate, alcohol, thyroid or liver conditions.',
    low: 'Smaller cells (called microcytosis) are most often associated with low iron stores; they can also occur with inherited traits such as thalassemia trait.',
    nutrition: 'Iron-rich foods paired with vitamin C; keep tea and coffee away from meals.',
    lifestyle: 'Note any heavy periods, tiredness or breathlessness to discuss.',
    followUp: ['Ferritin', 'Iron, TIBC and iron saturation', 'Hemoglobin electrophoresis if iron studies are normal'],
    questions: ['What could explain my red cell size, and should we check ferritin and iron studies?'],
  },
  {
    id: 'mch', name: 'MCH (hemoglobin per red cell)', short: 'MCH', category: 'cbc',
    aliases: ['mch', 'mean corpuscular hemoglobin', 'mean cell hemoglobin'],
    what: 'The average amount of hemoglobin inside each red blood cell.',
    why: 'Usually moves with MCV and helps describe the type of any anemia.',
    high: 'Can go with larger cells, which can be associated with low B12 or folate.',
    low: 'Cells carrying less hemoglobin (paler cells) are often associated with low iron or inherited red-cell traits.',
    nutrition: 'Iron-rich foods with vitamin C support hemoglobin production.',
    lifestyle: 'Same as MCV.',
    followUp: ['Ferritin', 'Iron studies'],
    questions: ['How does my MCH result fit with my MCV result?'],
  },
  {
    id: 'mchc', name: 'MCHC', short: 'MCHC', category: 'cbc',
    aliases: ['mchc', 'mean corpuscular hemoglobin concentration'],
    what: 'How concentrated the hemoglobin is inside red cells.',
    why: 'Adds detail to MCV and MCH.',
    high: 'Can be seen with certain red-cell shape conditions or sample issues.',
    low: 'Can be associated with low iron.',
    nutrition: 'Iron, B12 and folate support healthy red cells.',
    lifestyle: '—',
    followUp: ['CBC recheck'],
    questions: ['Does my MCHC add anything to my other red-cell results?'],
  },
  {
    id: 'rdw', name: 'RDW (red cell size variation)', short: 'RDW', category: 'cbc',
    aliases: ['rdw', 'red cell distribution width', 'rdw cv'],
    what: 'How much your red blood cells vary in size.',
    why: 'Helps tell apart causes of small or large red cells.',
    high: 'More size variation can be seen with iron, B12 or folate shortage.',
    low: 'A low RDW is not usually a concern.',
    nutrition: 'Balanced iron, B12 and folate intake.',
    lifestyle: '—',
    followUp: ['Ferritin and iron studies if raised with small cells'],
    questions: ['Does my RDW help explain my red-cell size?'],
  },
  {
    id: 'platelets', name: 'Platelets', short: 'Platelets', category: 'cbc',
    aliases: ['platelets', 'platelet count', 'plt'],
    what: 'Tiny cells that help blood clot.',
    why: 'Screens for bleeding or clotting tendencies.',
    high: 'Can be seen with inflammation, low iron or after infection.',
    low: 'Can be seen with some infections, medicines or immune conditions.',
    nutrition: 'Folate and B12 support platelet production.',
    lifestyle: 'Report unusual bruising or bleeding.',
    followUp: ['CBC recheck'],
    questions: ['Is my platelet count normal for me?'],
  },
  {
    id: 'mpv', name: 'MPV (average platelet size)', short: 'MPV', category: 'cbc',
    aliases: ['mpv', 'mean platelet volume'],
    what: 'The average size of your platelets.',
    why: 'Adds context to the platelet count.',
    high: 'Larger platelets can be seen when the body is making new platelets quickly.',
    low: 'Smaller platelets are usually not significant alone.',
    nutrition: '—', lifestyle: '—',
    followUp: [],
    questions: [],
  },
  // Glucose
  {
    id: 'fasting_glucose', trendDelta: 5, name: 'Fasting glucose', short: 'Fasting glucose', category: 'glucose',
    aliases: ['fasting glucose', 'glucose', 'glucose fasting', 'fbs', 'fasting blood sugar', 'fasting plasma glucose'],
    what: 'The amount of sugar in your blood after not eating for 8+ hours.',
    why: 'Screens for prediabetes and diabetes and tracks blood sugar control.',
    high: 'Can be associated with insulin resistance, prediabetes or diabetes; illness, stress, poor sleep and some medicines can also raise it.',
    low: 'Low fasting glucose can occur with long fasting, heavy exercise or some medicines.',
    nutrition: 'Fiber-rich meals, fewer sugary drinks and refined carbs, protein with each meal.',
    lifestyle: 'Regular activity (especially walking after meals), 7–9 hours of sleep, weight management if appropriate.',
    followUp: ['HbA1c', 'Repeat fasting glucose'],
    questions: ['Is my fasting glucose something we should confirm or recheck?'],
    rule: (v, r) => {
      if (r.status !== 'HIGH') return null;
      if (v >= 126) return lv('priority', 'At or above 126 mg/dL fasting; a level usually confirmed with repeat testing.');
      if (v >= 100) return lv('attention', 'In the 100–125 mg/dL fasting band.');
      return null;
    },
  },
  {
    id: 'hba1c', trendDelta: 0.2, name: 'HbA1c (3-month blood sugar average)', short: 'HbA1c', category: 'glucose',
    aliases: ['hba1c', 'hemoglobin a1c', 'a1c', 'glycated hemoglobin', 'glycohemoglobin'],
    what: 'Reflects your average blood sugar over roughly the past 2–3 months.',
    why: 'Used to screen for prediabetes and diabetes and to track blood sugar control over time.',
    high: '5.7–6.4% is commonly described as the prediabetes range; 6.5% or higher can be associated with diabetes and is usually confirmed with repeat testing.',
    low: 'Low values are uncommon and can be affected by anemia or recent blood loss.',
    nutrition: 'Fewer refined carbs and sweet drinks, more fiber (vegetables, dal, whole grains), protein at each meal.',
    lifestyle: 'About 150 minutes a week of activity, strength training twice a week, walking after meals, good sleep.',
    followUp: ['Repeat HbA1c', 'Fasting glucose', 'Urine albumin-to-creatinine ratio', 'Kidney function'],
    questions: ['What does my HbA1c mean for me, and does it need to be confirmed?', 'When should HbA1c be rechecked?'],
    rule: (v, r) => {
      if (r.status !== 'HIGH') return null;
      if (v >= 6.5) return lv('priority', '6.5% or above; important to review with a clinician soon.');
      return lv('attention', '5.7–6.4% is above the lab range.');
    },
  },
  {
    id: 'insulin', name: 'Insulin', short: 'Insulin', category: 'glucose',
    aliases: ['insulin', 'fasting insulin'],
    what: 'The hormone that moves sugar from blood into cells.', why: 'Can help assess insulin resistance.',
    high: 'Can be associated with insulin resistance.', low: 'Interpreted together with glucose.',
    nutrition: 'Fiber-rich, lower refined-carb meals.', lifestyle: 'Regular activity improves insulin sensitivity.',
    followUp: ['Fasting glucose', 'HbA1c'], questions: [],
  },
  {
    id: 'eag', name: 'Estimated average glucose', short: 'eAG', category: 'glucose',
    aliases: ['estimated average glucose', 'eag'],
    what: 'HbA1c converted to an average glucose number.', why: 'Easier to compare with daily glucose readings.',
    high: 'Moves with HbA1c.', low: 'Moves with HbA1c.', nutrition: 'As for HbA1c.', lifestyle: 'As for HbA1c.',
    followUp: [], questions: [],
  },
  // Lipids
  {
    id: 'total_cholesterol', name: 'Total cholesterol', short: 'Total cholesterol', category: 'lipids',
    aliases: ['total cholesterol', 'cholesterol total', 'cholesterol'],
    what: 'All the cholesterol carried in your blood.',
    why: 'A general screen of blood fats; best read together with LDL, HDL and non-HDL.',
    high: 'Can be associated with higher long-term heart and blood-vessel risk, depending on the LDL and HDL parts.',
    low: 'Low total cholesterol is usually not a concern.',
    nutrition: 'Less saturated fat (butter, ghee, fatty meat, fried food), more soluble fiber (oats, beans).',
    lifestyle: 'Regular activity and a healthy weight.',
    followUp: ['Repeat lipid panel'],
    questions: ['What cholesterol targets are right for me?'],
    rule: (v, r) => {
      if (r.status !== 'HIGH') return null;
      if (v >= 240) return lv('attention', '240 mg/dL or above is considered high.');
      return lv('watch', '200–239 mg/dL is borderline high.');
    },
  },
  {
    id: 'hdl', name: 'HDL cholesterol ("good" cholesterol)', short: 'HDL', category: 'lipids',
    aliases: ['hdl', 'hdl cholesterol', 'hdl c', 'high density lipoprotein'],
    what: 'Carries cholesterol away from the arteries back to the liver.',
    why: 'Higher HDL is generally linked with lower heart risk.',
    high: 'High HDL is usually favorable.',
    low: 'Low HDL can be associated with higher heart risk, low activity, refined-carb-heavy diets, high triglycerides or genetics.',
    nutrition: 'Healthy fats (olive oil, nuts, seeds, fatty fish), fewer refined carbs and trans fats.',
    lifestyle: 'Regular aerobic exercise is the most reliable way to raise HDL; not smoking also helps.',
    followUp: ['Repeat lipid panel'],
    questions: ['Does my family history change how much my HDL matters?'],
    rule: (v, r) => {
      if (r.status !== 'LOW') return null;
      if (v < 35) return lv('attention', 'Well below the lab range.');
      return lv('watch', 'Below the lab range; a mild risk factor on its own.');
    },
  },
  {
    id: 'ldl', name: 'LDL cholesterol', short: 'LDL', category: 'lipids',
    aliases: ['ldl', 'ldl cholesterol', 'ldl c', 'ldl calc', 'low density lipoprotein', 'ldl direct'],
    what: 'The main cholesterol carrier that can build up in artery walls.',
    why: 'A key marker for long-term heart and blood-vessel risk.',
    high: 'Higher LDL can be associated with greater long-term heart risk, especially with other risk factors like high blood sugar.',
    low: 'Low LDL is generally favorable.',
    nutrition: 'Less saturated fat; more soluble fiber (oats, barley, beans), nuts and plant oils.',
    lifestyle: 'Regular activity, healthy weight, not smoking.',
    followUp: ['Repeat lipid panel', 'ApoB', 'Lipoprotein(a)'],
    questions: ['What LDL goal fits my overall risk?', 'Would ApoB or Lp(a) testing help?'],
    rule: (v, r) => {
      if (r.status !== 'HIGH') return null;
      if (v >= 190) return lv('priority', '190 mg/dL or above is very high.');
      if (v >= 130) return lv('attention', '130–189 mg/dL is borderline high to high.');
      return lv('watch', '100–129 mg/dL is slightly above the lab range.');
    },
  },
  {
    id: 'triglycerides', name: 'Triglycerides', short: 'Triglycerides', category: 'lipids',
    aliases: ['triglycerides', 'triglyceride', 'tg', 'trigs'],
    what: 'A type of fat in the blood that comes from food and is also made by the liver from extra sugar and calories.',
    why: 'High levels can be associated with heart risk and often rise together with blood sugar.',
    high: 'Can be associated with high intake of sugar and refined carbs, alcohol, higher blood sugar, low activity or genetics. Very high levels (500+) also raise pancreas concerns.',
    low: 'Low triglycerides are usually not a concern.',
    nutrition: 'Cut sweet drinks and sweets, reduce refined carbs, limit alcohol, eat fatty fish or omega-3 foods.',
    lifestyle: 'Regular activity and weight management if appropriate are very effective.',
    followUp: ['Repeat fasting lipid panel', 'HbA1c'],
    questions: ['What triglyceride target should I aim for?', 'Is alcohol or sugar intake likely playing a role?'],
    rule: (v, r) => {
      if (r.status !== 'HIGH') return null;
      if (v >= 500) return lv('priority', '500 mg/dL or above is very high.');
      if (v >= 200) return lv('attention', '200–499 mg/dL is high.');
      return lv('watch', '150–199 mg/dL is borderline high.');
    },
  },
  {
    id: 'non_hdl', name: 'Non-HDL cholesterol', short: 'Non-HDL', category: 'lipids',
    aliases: ['non hdl cholesterol', 'non hdl', 'nonhdl', 'non hdl c'],
    what: 'Total cholesterol minus HDL: all the cholesterol carriers that can build up in arteries.',
    why: 'Especially useful when triglycerides are high, because LDL calculations get less precise.',
    high: 'Can be associated with higher long-term heart risk.',
    low: 'Low values are favorable.',
    nutrition: 'Less saturated fat and sugar, more fiber and omega-3.',
    lifestyle: 'Activity and weight management if appropriate.',
    followUp: ['Repeat lipid panel', 'ApoB'],
    questions: ['What non-HDL goal should I aim for?'],
    rule: (v, r) => {
      if (r.status !== 'HIGH') return null;
      if (v >= 220) return lv('priority', 'Very high.');
      if (v >= 160) return lv('attention', 'Clearly above the target.');
      return lv('watch', 'Slightly above the lab range.');
    },
  },
  {
    id: 'chol_hdl_ratio', name: 'Cholesterol/HDL ratio', short: 'Chol/HDL ratio', category: 'lipids',
    aliases: ['chol hdl ratio', 'chol hdlc ratio', 'cholesterol hdlc ratio', 'cholesterol hdl ratio', 'total cholesterol hdl ratio', 'tc hdl ratio'],
    what: 'Total cholesterol divided by HDL.',
    why: 'A quick summary of the balance between total and "good" cholesterol.',
    high: 'A higher ratio can be associated with higher heart risk.',
    low: 'A lower ratio is favorable.',
    nutrition: 'Same as LDL and HDL.', lifestyle: 'Regular aerobic exercise.',
    followUp: ['Repeat lipid panel'], questions: [],
    rule: (v, r) => (r.status === 'HIGH' ? lv('watch', 'Only slightly above the cut-off.') : null),
  },
  {
    id: 'apob', name: 'Apolipoprotein B (ApoB)', short: 'ApoB', category: 'lipids',
    aliases: ['apob', 'apolipoprotein b', 'apo b'],
    what: 'Counts the particles that carry cholesterol into artery walls.', why: 'A precise measure of atherogenic particles.',
    high: 'Can be associated with higher heart risk.', low: 'Favorable.',
    nutrition: 'As for LDL.', lifestyle: 'As for LDL.', followUp: ['Repeat lipid panel'], questions: [],
  },
  {
    id: 'lpa', name: 'Lipoprotein(a)', short: 'Lp(a)', category: 'lipids',
    aliases: ['lipoprotein a', 'lp a', 'lpa'],
    what: 'An inherited cholesterol particle.', why: 'Usually measured once to understand inherited heart risk.',
    high: 'Can be associated with higher inherited heart risk.', low: 'Favorable.',
    nutrition: 'Diet has little effect on Lp(a).', lifestyle: 'Managing other risk factors matters more.', followUp: [], questions: [],
  },
  // Liver
  {
    id: 'alt', name: 'ALT (liver enzyme)', short: 'ALT', category: 'liver',
    aliases: ['alt', 'alanine aminotransferase', 'sgpt', 'alt sgpt'],
    what: 'An enzyme mostly found in the liver.',
    why: 'Rises when liver cells are irritated or injured.',
    high: 'Can be associated with fatty liver, alcohol, some medicines or supplements, or viral hepatitis.',
    low: 'Low ALT is generally not a concern.',
    nutrition: 'Limiting sugar, refined carbs and alcohol supports liver health.',
    lifestyle: 'Weight management if appropriate; check medicines and supplements with a clinician.',
    followUp: ['Repeat liver panel'], questions: ['Are my liver enzymes normal for me?'],
  },
  {
    id: 'ast', name: 'AST (liver/muscle enzyme)', short: 'AST', category: 'liver',
    aliases: ['ast', 'aspartate aminotransferase', 'sgot', 'ast sgot'],
    what: 'An enzyme found in the liver, heart and muscles.',
    why: 'Read together with ALT to check liver health.',
    high: 'Can be associated with liver irritation, recent hard exercise or muscle injury.',
    low: 'A low AST is generally not considered meaningful on its own; it is sometimes seen with low vitamin B6.',
    nutrition: 'A balanced diet with B vitamins.', lifestyle: '—',
    followUp: [], questions: ['What does my AST result mean alongside my other liver tests?'],
    rule: (v, r) => (r.status === 'LOW' ? lv('watch', 'Low AST is usually low concern.') : null),
  },
  {
    id: 'alp', name: 'Alkaline phosphatase (ALP)', short: 'ALP', category: 'liver',
    aliases: ['alp', 'alkaline phosphatase', 'alk phos'],
    what: 'An enzyme from the liver, bile ducts and bones.',
    why: 'Helps check bile flow and bone turnover.',
    high: 'Can be associated with bile-duct issues, bone growth or bone conditions, or low vitamin D.',
    low: 'Can occasionally be seen with low zinc or magnesium.',
    nutrition: 'Adequate vitamin D, zinc and magnesium.', lifestyle: '—',
    followUp: ['GGT if raised'], questions: [],
  },
  {
    id: 'bilirubin_total', name: 'Bilirubin, total', short: 'Bilirubin', category: 'liver',
    aliases: ['bilirubin total', 'total bilirubin', 'bilirubin', 'tbil'],
    what: 'A yellow pigment made when old red blood cells are broken down.',
    why: 'Checks liver processing and red-cell breakdown.',
    high: 'Can be seen with liver or bile issues, Gilbert syndrome (harmless), or faster red-cell breakdown.',
    low: 'Low bilirubin is not a concern.',
    nutrition: '—', lifestyle: 'Fasting can raise it slightly.', followUp: [], questions: [],
  },
  {
    id: 'albumin', name: 'Albumin', short: 'Albumin', category: 'liver',
    aliases: ['albumin', 'serum albumin'],
    what: 'The main protein made by the liver.', why: 'Reflects nutrition, liver function and hydration.',
    high: 'Usually reflects dehydration.', low: 'Can be associated with low protein intake, liver or kidney conditions, or inflammation.',
    nutrition: 'Adequate protein intake.', lifestyle: 'Hydration.', followUp: [], questions: [],
  },
  {
    id: 'total_protein', name: 'Total protein', short: 'Total protein', category: 'liver',
    aliases: ['total protein', 'protein total'],
    what: 'Albumin plus globulins in the blood.', why: 'A general check of nutrition and liver/immune proteins.',
    high: 'Can be seen with dehydration or chronic inflammation.', low: 'Can be associated with low protein intake or liver/kidney issues.',
    nutrition: 'Adequate protein.', lifestyle: '—', followUp: [], questions: [],
  },
  {
    id: 'globulin', name: 'Globulin', short: 'Globulin', category: 'liver',
    aliases: ['globulin'],
    what: 'Proteins including antibodies.', why: 'Calculated from total protein and albumin.',
    high: 'Can be seen with inflammation or infection.', low: 'Can be seen with some immune conditions.',
    nutrition: '—', lifestyle: '—', followUp: [], questions: [],
  },
  {
    id: 'ag_ratio', name: 'Albumin/Globulin ratio', short: 'A/G ratio', category: 'liver',
    aliases: ['albumin globulin ratio', 'a g ratio', 'ag ratio'],
    what: 'Albumin divided by globulin.', why: 'A summary of the protein balance.',
    high: 'Usually not significant alone.', low: 'Can be seen when globulins are raised.',
    nutrition: '—', lifestyle: '—', followUp: [], questions: [],
  },
  {
    id: 'ggt', name: 'GGT', short: 'GGT', category: 'liver',
    aliases: ['ggt', 'gamma glutamyl transferase'],
    what: 'A liver and bile-duct enzyme.', why: 'Helps explain a raised ALP and is sensitive to alcohol.',
    high: 'Can be associated with alcohol use, fatty liver or bile-duct issues.', low: 'Not a concern.',
    nutrition: 'Limit alcohol.', lifestyle: '—', followUp: [], questions: [],
  },
  // Kidney
  {
    id: 'creatinine', name: 'Creatinine', short: 'Creatinine', category: 'kidney',
    aliases: ['creatinine', 'serum creatinine', 'creat'],
    what: 'A waste product from muscles, cleared by the kidneys.',
    why: 'Used to estimate how well the kidneys filter.',
    high: 'Can be associated with reduced kidney filtering, dehydration, high muscle mass or high meat intake before the test.',
    low: 'Usually reflects lower muscle mass; not a concern on its own.',
    nutrition: 'Stay hydrated; avoid very large meat meals before testing.', lifestyle: 'Hydration.',
    followUp: ['eGFR', 'Urine albumin-to-creatinine ratio'], questions: [],
  },
  {
    id: 'egfr', name: 'eGFR (kidney filtering rate)', short: 'eGFR', category: 'kidney',
    aliases: ['egfr', 'estimated gfr', 'gfr'],
    what: 'An estimate of how much blood your kidneys filter each minute.',
    why: 'The main number used to stage kidney function.',
    high: 'High values are usually fine.',
    low: 'Below 60 for 3+ months can be associated with reduced kidney function.',
    nutrition: 'Moderate salt; stay hydrated.', lifestyle: 'Blood pressure and blood sugar control protect the kidneys.',
    followUp: ['Urine albumin-to-creatinine ratio', 'Repeat kidney panel'], questions: [],
  },
  {
    id: 'bun', name: 'BUN (urea nitrogen)', short: 'BUN', category: 'kidney',
    aliases: ['bun', 'urea nitrogen', 'blood urea nitrogen', 'urea'],
    what: 'A waste product from protein breakdown, cleared by the kidneys.',
    why: 'Read together with creatinine to check kidney function and hydration.',
    high: 'Can be seen with dehydration, high protein intake or reduced kidney filtering.',
    low: 'Can be seen with lower protein intake; usually not a concern.',
    nutrition: 'Balanced protein intake.', lifestyle: 'Hydration.', followUp: [], questions: [],
  },
  {
    id: 'bun_creatinine_ratio', name: 'BUN/Creatinine ratio', short: 'BUN/Creat ratio', category: 'kidney',
    aliases: ['bun creatinine ratio', 'bun creat ratio', 'bun cr ratio'],
    what: 'BUN divided by creatinine.', why: 'Helps tell dehydration from kidney causes when either is abnormal.',
    high: 'Can be seen with dehydration.', low: 'Can be seen with low protein intake.',
    nutrition: '—', lifestyle: '—', followUp: [], questions: [],
  },
  {
    id: 'urine_albumin', name: 'Urine albumin', short: 'Urine albumin', category: 'kidney',
    aliases: ['urine albumin', 'microalbumin', 'urine albumin creatinine ratio', 'uacr'],
    what: 'Protein leaking into the urine.', why: 'An early sign of kidney stress, especially with high blood sugar or blood pressure.',
    high: 'Can be associated with early kidney stress.', low: 'Normal.', nutrition: '—', lifestyle: '—', followUp: [], questions: [],
  },
  // Electrolytes
  {
    id: 'sodium', name: 'Sodium', short: 'Sodium', category: 'electrolytes',
    aliases: ['sodium', 'na'],
    what: 'A salt that controls fluid balance.', why: 'Checks hydration and fluid balance.',
    high: 'Usually reflects dehydration.', low: 'Can be seen with too much water, some medicines or hormone issues.',
    nutrition: 'Most people benefit from moderate salt.', lifestyle: 'Hydration.', followUp: [], questions: [],
    rule: (v) => (v < 130 || v > 150 ? lv('priority', 'Well outside the usual range.') : null),
  },
  {
    id: 'potassium', name: 'Potassium', short: 'Potassium', category: 'electrolytes',
    aliases: ['potassium', 'k'],
    what: 'A mineral important for heart rhythm and muscles.', why: 'Checks kidney function and medicine effects.',
    high: 'Can be seen with kidney issues, some medicines, or a sample that sat too long.', low: 'Can be seen with vomiting, diarrhea or some medicines.',
    nutrition: 'Fruits, vegetables and beans supply potassium.', lifestyle: '—', followUp: [], questions: [],
    rule: (v) => (v < 3.0 || v > 6.0 ? lv('priority', 'Well outside the usual range.') : null),
  },
  {
    id: 'chloride', name: 'Chloride', short: 'Chloride', category: 'electrolytes',
    aliases: ['chloride', 'cl'],
    what: 'A salt that moves with sodium.', why: 'Checks fluid and acid-base balance.',
    high: 'Can be seen with dehydration.', low: 'Can be seen with vomiting.', nutrition: '—', lifestyle: '—', followUp: [], questions: [],
  },
  {
    id: 'co2', name: 'CO2 (bicarbonate)', short: 'CO2', category: 'electrolytes',
    aliases: ['co2', 'co2 bicarbonate', 'carbon dioxide total', 'bicarbonate', 'carbon dioxide', 'hco3', 'total co2'],
    what: 'Bicarbonate, the body\'s main acid buffer.', why: 'Checks acid-base balance.',
    high: 'Can be seen with vomiting or some medicines.', low: 'Can be seen with kidney issues or diarrhea.',
    nutrition: '—', lifestyle: '—', followUp: [], questions: [],
  },
  {
    id: 'magnesium', name: 'Magnesium', short: 'Magnesium', category: 'vitamins',
    aliases: ['magnesium', 'mg'],
    what: 'A mineral used by muscles, nerves and bones.', why: 'Checked when other minerals are off.',
    high: 'Uncommon; can be seen with kidney issues.', low: 'Can be associated with low intake or some medicines.',
    nutrition: 'Nuts, seeds, greens and whole grains.', lifestyle: '—', followUp: [], questions: [],
  },
  // Thyroid
  {
    id: 'tsh', name: 'TSH (thyroid-stimulating hormone)', short: 'TSH', category: 'thyroid',
    aliases: ['tsh', 'thyroid stimulating hormone', 'tsh w reflex to ft4', 'tsh with reflex'],
    what: 'A hormone from the brain that tells the thyroid how hard to work.',
    why: 'The main screening test for thyroid function.',
    high: 'Can be associated with an underactive thyroid.', low: 'Can be associated with an overactive thyroid or thyroid medicine dose.',
    nutrition: 'Adequate iodine (iodized salt, dairy); avoid high-dose iodine or biotin supplements before testing.',
    lifestyle: '—', followUp: ['Free T4', 'Thyroid antibodies'], questions: [],
  },
  {
    id: 'free_t4', name: 'Free T4', short: 'Free T4', category: 'thyroid',
    aliases: ['free t4', 'ft4', 'free thyroxine', 't4 free'],
    what: 'The main thyroid hormone circulating freely in blood.', why: 'Read with TSH to check thyroid function.',
    high: 'Can be associated with an overactive thyroid.', low: 'Can be associated with an underactive thyroid.',
    nutrition: 'As for TSH.', lifestyle: '—', followUp: ['TSH'], questions: [],
  },
  {
    id: 'free_t3', name: 'Free T3', short: 'Free T3', category: 'thyroid',
    aliases: ['free t3', 'ft3'], what: 'The active thyroid hormone.', why: 'Sometimes added to TSH and Free T4.',
    high: 'Can be associated with an overactive thyroid.', low: 'Can be seen with illness or underactive thyroid.',
    nutrition: '—', lifestyle: '—', followUp: [], questions: [],
  },
  // Vitamins / Minerals
  {
    id: 'vitamin_d', name: 'Vitamin D, 25-OH', short: 'Vitamin D', category: 'vitamins',
    aliases: ['vitamin d', 'vitamin d 25 oh total', 'vitamin d 25 oh total ia', 'vitamin d 25 oh', '25 oh vitamin d', '25 hydroxy vitamin d', 'vit d', 'vitamin d total'],
    what: 'Measures your body\'s vitamin D stores.',
    why: 'Vitamin D helps absorb calcium and supports bones, muscles and immune function.',
    high: 'Very high levels usually come from high-dose supplements.',
    low: 'Low vitamin D can be associated with limited sun exposure, darker skin, indoor lifestyle or few vitamin D foods. Food alone rarely raises a low level much.',
    nutrition: 'Fatty fish (salmon, sardines), egg yolks, vitamin D-fortified milk, yogurt or soy milk, UV-exposed mushrooms.',
    lifestyle: 'Some safe midday sunlight on arms and face a few times a week; avoid sunburn.',
    followUp: ['Repeat vitamin D after any changes (often in about 3 months)'],
    questions: ['Do you recommend a vitamin D supplement, at what dose, and when should I recheck?'],
    rule: (v, r) => {
      if (r.status !== 'LOW') return null;
      if (v < 12) return lv('priority', 'Well below range.');
      return lv('attention', v < 20 ? 'Below 20 ng/mL is usually called deficiency.' : '20–29 ng/mL is usually called insufficiency.');
    },
  },
  {
    id: 'vitamin_b12', name: 'Vitamin B12', short: 'Vitamin B12', category: 'vitamins',
    aliases: ['vitamin b12', 'b12', 'cobalamin', 'vit b12'],
    what: 'Measures vitamin B12, which the body needs for nerves and red blood cells.',
    why: 'Low B12 can cause tiredness, tingling, memory issues and large red cells.',
    high: 'High B12 usually reflects supplements.',
    low: 'Low or low-normal B12 can be associated with vegetarian or vegan diets, acid-reducing medicines, metformin, or absorption problems.',
    nutrition: 'Eggs, dairy, fish, meat; for vegetarians, fortified cereals, fortified plant milks or nutritional yeast.',
    lifestyle: 'Mention tingling, numbness or tiredness to your clinician.',
    followUp: ['Repeat B12', 'Methylmalonic acid (MMA) to clarify borderline B12'],
    questions: ['Should my B12 be rechecked, or should methylmalonic acid (MMA) be tested?'],
    rule: (v, r) => {
      if (r.status === 'LOW') return lv('attention', 'Below the lab range.');
      if (r.status === 'IN RANGE' && v < 300) return lv('watch', 'In range but near the low end; values of 200–400 pg/mL can sometimes hide a shortage.');
      return null;
    },
  },
  {
    id: 'folate', name: 'Folate', short: 'Folate', category: 'vitamins',
    aliases: ['folate', 'folate serum', 'folic acid', 'serum folate'],
    what: 'A B vitamin needed to make red blood cells and DNA.',
    why: 'Checked with B12 when red cells are abnormal.',
    high: 'High folate usually reflects supplements or fortified foods.',
    low: 'Can be associated with low intake of greens and legumes, alcohol, or some medicines.',
    nutrition: 'Leafy greens, lentils, chickpeas, citrus.', lifestyle: '—', followUp: [], questions: [],
  },
  {
    id: 'calcium', name: 'Calcium', short: 'Calcium', category: 'vitamins',
    aliases: ['calcium', 'ca', 'serum calcium'],
    what: 'The mineral in blood that supports bones, nerves and muscles.',
    why: 'Blood calcium is tightly controlled, so it stays normal even when vitamin D is low.',
    high: 'Can be associated with parathyroid or vitamin D excess.', low: 'Can be associated with low vitamin D or low albumin.',
    nutrition: 'Dairy, fortified plant milks, ragi, sesame, leafy greens.', lifestyle: 'Weight-bearing exercise for bones.', followUp: [], questions: [],
  },
  // Iron
  {
    id: 'iron', name: 'Iron, total', short: 'Iron', category: 'iron',
    aliases: ['iron', 'iron total', 'serum iron'],
    what: 'The iron currently circulating in your blood.',
    why: 'Read with TIBC, saturation and ferritin to understand iron status.',
    high: 'Can be seen with supplements or iron overload conditions.',
    low: 'Can be associated with low iron intake or stores, or inflammation. It varies a lot during the day.',
    nutrition: 'Iron-rich foods with vitamin C; tea and coffee away from meals.', lifestyle: '—',
    followUp: ['Ferritin', 'CBC'], questions: [],
  },
  {
    id: 'tibc', name: 'TIBC (iron-binding capacity)', short: 'TIBC', category: 'iron',
    aliases: ['tibc', 'total iron binding capacity', 'iron binding capacity'],
    what: 'How much iron your blood could carry.', why: 'Rises when the body is short of iron.',
    high: 'Can be associated with low iron stores.', low: 'Can be seen with inflammation or iron overload.',
    nutrition: 'As for iron.', lifestyle: '—', followUp: [], questions: [],
  },
  {
    id: 'iron_saturation', name: 'Iron saturation', short: 'Iron saturation', category: 'iron',
    aliases: ['iron saturation', 'saturation', 'transferrin saturation', 'tsat', 'percent saturation', 'iron sat'],
    what: 'The share of the blood\'s iron carriers that are loaded with iron.',
    why: 'Helps show whether enough iron is available for making red cells.',
    high: 'Can be associated with iron overload.', low: 'Can be associated with low iron availability, low intake or inflammation; mildly low values often vary day to day.',
    nutrition: 'Iron-rich foods paired with vitamin C; tea and coffee away from meals.', lifestyle: '—',
    followUp: ['CBC', 'Repeat iron studies'], questions: ['Given my iron saturation result, should I have a CBC or repeat iron studies?'],
    rule: (v, r, pct) => (r.status === 'LOW' && pct < 0.15 ? lv('watch', 'Only slightly low.') : null),
  },
  {
    id: 'ferritin', name: 'Ferritin (iron stores)', short: 'Ferritin', category: 'iron',
    aliases: ['ferritin', 'serum ferritin'],
    what: 'A protein that reflects how much iron is stored in your body.',
    why: 'The most useful single test for low iron stores.',
    high: 'Can be seen with inflammation, liver conditions or iron overload.', low: 'Can be associated with low iron stores.',
    nutrition: 'Iron-rich foods with vitamin C.', lifestyle: 'Mention heavy periods or blood loss.',
    followUp: ['CBC', 'Iron studies'], questions: [],
  },
  // Hormonal
  {
    id: 'amh', name: 'AMH (anti-Müllerian hormone)', short: 'AMH', category: 'hormonal',
    aliases: ['amh', 'anti mullerian hormone female', 'anti mullerian hormone', 'anti müllerian hormone'],
    what: 'A hormone made by the ovaries.', why: 'Used by clinicians in specific contexts; its meaning depends on why it was ordered.',
    high: 'Interpretation depends on clinical context.', low: 'Interpretation depends on clinical context.',
    nutrition: '—', lifestyle: '—', followUp: [],
    questions: ['What were you looking for with the AMH test, and what does my result mean in that context?'],
    caution: 'This value alone does not show fertility status.',
  },
  // Other
  {
    id: 'h_pylori_ubt', name: 'H. pylori urea breath test', short: 'H. pylori breath test', category: 'other',
    aliases: ['h pylori urea breath test', 'helicobacter pylori urea breath test', 'h pylori breath test', 'helicobacter pylori breath test', 'h pylori ubt'],
    what: 'Checks for H. pylori, a stomach bacterium.', why: 'Ordered for stomach symptoms or ulcers.',
    high: 'A positive result means the bacteria were detected.', low: '"Not detected" is the expected result.',
    nutrition: '—', lifestyle: 'Acid-reducing medicines, antibiotics or bismuth before the test can cause false negatives.',
    followUp: [], questions: ['Was I off acid-reducing medicines and antibiotics long enough before the breath test?'],
    expected: 'NOT DETECTED',
  },
];
