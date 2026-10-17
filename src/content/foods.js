// Food library. `supports` maps a lab-driven need to strength (1–3).
// Needs: glycemic, triglycerides, ldl, hdl, iron, vitd, b12, folate, liver, kidney.
// `caution` lists needs that make this food a poorer fit (it is penalized, never "dangerous").
// `group` limits near-duplicates in the Top 10; `section` places it in "Foods to eat more often".

export const NEED_LABEL = {
  glycemic: 'Blood sugar', triglycerides: 'Triglycerides', ldl: 'LDL / non-HDL cholesterol', hdl: 'HDL cholesterol',
  iron: 'Red cells & iron', vitd: 'Vitamin D', b12: 'Vitamin B12', folate: 'Folate', liver: 'Liver', kidney: 'Kidney',
};

export const FOODS = [
  {
    id: 'vegetables', name: 'Non-starchy vegetables', emoji: '🥦', section: 'Vegetables', group: 'veg',
    benefit: 'Fiber, volume, few carbs', serving: 'Half the plate (2+ cups)', frequency: 'Lunch and dinner daily',
    supports: { glycemic: 3, triglycerides: 2, ldl: 1 },
    why: { glycemic: 'Fills you up with very little carbohydrate, leaving less room for refined starch.', triglycerides: 'Swapping some rice or bread for vegetables lowers the carb load that drives triglycerides.', ldl: 'Adds fiber that helps cholesterol.' },
    ideas: 'Bhindi, cauliflower, cabbage, beans sabzi; broccoli, peppers, salads',
  },
  {
    id: 'lentils', name: 'Lentils & dal', emoji: '🍲', section: 'Protein', group: 'legume',
    benefit: 'Plant protein, fiber, iron, folate', serving: '½–1 cup cooked', frequency: '4–5 times a week',
    supports: { glycemic: 2, ldl: 2, iron: 2, folate: 2, triglycerides: 1 },
    why: { glycemic: 'Fiber and protein slow the rise in blood sugar after meals.', ldl: 'Soluble fiber helps lower LDL.', iron: 'A good everyday plant source of iron, especially with lemon.', folate: 'Rich in folate.', triglycerides: 'A filling replacement for part of the rice or bread.' },
    ideas: 'Moong or masoor dal with lemon; lentil soup',
  },
  {
    id: 'oats', name: 'Oats or barley', emoji: '🥣', section: 'Whole grains', group: 'grain',
    benefit: 'Beta-glucan (soluble fiber)', serving: '½ cup dry oats', frequency: 'Most days',
    supports: { ldl: 3, glycemic: 2, triglycerides: 1 },
    why: { ldl: 'Beta-glucan fiber is shown to lower LDL cholesterol.', glycemic: 'Steadier blood sugar than refined breakfast cereals.', triglycerides: 'Replaces refined, sugary breakfast options.' },
    ideas: 'Savory oats upma; steel-cut oats with nuts; barley in soups',
  },
  {
    id: 'fish', name: 'Fatty fish', emoji: '🐟', section: 'Protein', group: 'fish', nonVeg: true,
    benefit: 'Omega-3 fats, vitamin D, B12', serving: '3–4 oz cooked', frequency: '2 times a week',
    supports: { triglycerides: 3, vitd: 3, b12: 3, hdl: 2, ldl: 1, iron: 1 },
    why: { triglycerides: 'Omega-3 fats help lower triglycerides.', vitd: 'One of the few foods naturally rich in vitamin D.', b12: 'Rich in vitamin B12.', hdl: 'Healthy fats that support HDL.', ldl: 'A lean replacement for fatty red meat.', iron: 'Provides easily absorbed iron.' },
    ideas: 'Fish curry with little oil; baked salmon; sardines on toast',
    vegAlt: 'Vegetarian: walnuts plus ground flax daily, and fortified milk for vitamin D',
  },
  {
    id: 'fortified_milk', name: 'Vitamin D-fortified milk, yogurt or soy milk', emoji: '🥛', section: 'Vitamin/mineral-rich foods', group: 'dairy',
    benefit: 'Vitamin D, B12, calcium, protein', serving: '1 cup', frequency: '1–2 times a day',
    supports: { vitd: 3, b12: 2 },
    why: { vitd: 'An everyday food source of vitamin D (check the label says "vitamin D").', b12: 'Dairy and fortified soy milk supply B12.' },
    ideas: 'Curd with lunch; milk in oats; unsweetened soy milk',
    note: 'Choose unsweetened; low-fat if LDL is high.',
  },
  {
    id: 'chickpeas', name: 'Chickpeas, rajma & beans', emoji: '🫘', section: 'Protein', group: 'legume',
    benefit: 'Fiber, protein, iron', serving: '½–1 cup cooked', frequency: '3–4 times a week',
    supports: { glycemic: 2, ldl: 2, iron: 2, folate: 1 },
    why: { glycemic: 'High fiber and protein for a gentle blood sugar rise.', ldl: 'Soluble fiber helps lower LDL.', iron: 'Good plant iron, best with vitamin C.', folate: 'Adds folate.' },
    ideas: 'Chana masala, rajma, sprouts chaat; hummus, bean chili',
  },
  {
    id: 'flax', name: 'Ground flaxseed or chia', emoji: '🌱', section: 'Nuts and seeds', group: 'seeds_omega',
    benefit: 'Plant omega-3 (ALA), soluble fiber', serving: '1–2 tablespoons', frequency: 'Daily',
    supports: { triglycerides: 2, ldl: 2, glycemic: 1, hdl: 1 },
    why: { triglycerides: 'Plant omega-3 fats can help triglycerides.', ldl: 'Soluble fiber helps LDL.', glycemic: 'Fiber slows sugar absorption.', hdl: 'Healthy fats support HDL.' },
    ideas: 'Stir into oats, curd, roti dough or smoothies',
  },
  {
    id: 'walnuts', name: 'Walnuts', emoji: '🌰', section: 'Nuts and seeds', group: 'nuts',
    benefit: 'Omega-3 (ALA), healthy fats', serving: '1 oz (7 halves)', frequency: 'Daily',
    supports: { ldl: 2, triglycerides: 2, hdl: 2 },
    why: { ldl: 'Unsaturated fats can help lower LDL.', triglycerides: 'Plant omega-3 supports healthier triglycerides.', hdl: 'Healthy fats support HDL.' },
    ideas: 'Snack, or on oats and salads',
  },
  {
    id: 'almonds', name: 'Almonds & mixed nuts', emoji: '🥜', section: 'Nuts and seeds', group: 'nuts',
    benefit: 'Healthy fats, vitamin E, magnesium', serving: '1 small handful (1 oz)', frequency: 'Daily',
    supports: { hdl: 2, ldl: 2, glycemic: 1 },
    why: { hdl: 'Unsaturated fats support HDL.', ldl: 'Can help lower LDL when they replace less healthy snacks.', glycemic: 'A filling snack that does not spike blood sugar.' },
    ideas: 'Soaked almonds in the morning; unsalted mixed nuts',
  },
  {
    id: 'pumpkin_seeds', name: 'Pumpkin & sesame seeds', emoji: '🎃', section: 'Nuts and seeds', group: 'seeds_iron',
    benefit: 'Iron, zinc, healthy fats', serving: '1–2 tablespoons', frequency: 'Daily',
    supports: { iron: 2, hdl: 1 },
    why: { iron: 'Among the richest plant sources of iron.', hdl: 'Healthy fats support HDL.' },
    ideas: 'Roasted as a snack; sprinkled on salads; til chutney',
  },
  {
    id: 'greens', name: 'Leafy greens', emoji: '🥬', section: 'Vegetables', group: 'greens',
    benefit: 'Iron, folate, fiber', serving: '1 cup cooked', frequency: '4–5 times a week',
    supports: { iron: 2, folate: 3, glycemic: 1 },
    why: { iron: 'Plant iron that absorbs better with vitamin C.', folate: 'Excellent folate source.', glycemic: 'Very low in carbohydrate.' },
    ideas: 'Palak, methi, amaranth sabzi; spinach in omelettes and dal',
  },
  {
    id: 'vitc_fruit', name: 'Vitamin C fruits (guava, amla, orange)', emoji: '🍊', section: 'Fruits', group: 'fruit',
    benefit: 'Vitamin C boosts plant-iron absorption', serving: '1 fruit', frequency: 'With iron-rich meals',
    supports: { iron: 2, glycemic: 1 },
    why: { iron: 'Vitamin C can help the body absorb plant iron from the same meal.', glycemic: 'Whole fruit with fiber is gentler on blood sugar than juice.' },
    ideas: 'Guava or orange after lunch; amla; lemon on dal',
  },
  {
    id: 'lowgi_fruit', name: 'Berries, apple, pear', emoji: '🍓', section: 'Fruits', group: 'fruit',
    benefit: 'Fiber with a gentler sugar rise', serving: '1 piece or 1 cup berries', frequency: '1–2 a day, spread out',
    supports: { glycemic: 2 },
    why: { glycemic: 'Whole fruit with skin gives fiber and a gentler sugar rise than sweets or juice.' },
    ideas: 'As a dessert swap; with a few nuts as a snack',
  },
  {
    id: 'olive_oil', name: 'Olive, canola or peanut oil', emoji: '🫒', section: 'Healthy fats', group: 'oil',
    benefit: 'Unsaturated fats', serving: '1–2 tbsp a day in total', frequency: 'As the main cooking fat',
    supports: { ldl: 2, hdl: 2 },
    why: { ldl: 'Replacing butter, ghee or coconut oil lowers saturated fat, which helps LDL.', hdl: 'Unsaturated fats support HDL.' },
    ideas: 'Measure with a spoon; tadka with less oil; salad dressing',
  },
  {
    id: 'avocado', name: 'Avocado', emoji: '🥑', section: 'Healthy fats', group: 'avocado',
    benefit: 'Monounsaturated fat, fiber', serving: '⅓ avocado', frequency: '3–4 times a week',
    supports: { hdl: 2, ldl: 1, glycemic: 1 },
    why: { hdl: 'Monounsaturated fat supports HDL.', ldl: 'Can help LDL when it replaces butter or cheese.', glycemic: 'Fat and fiber slow sugar absorption.' },
    ideas: 'On whole-grain toast; in salads or raita',
  },
  {
    id: 'millets', name: 'Millets (ragi, bajra, jowar)', emoji: '🌾', section: 'Whole grains', group: 'grain2',
    benefit: 'Fiber, minerals, slower carbs', serving: '1 roti or ½ cup cooked', frequency: 'Most days',
    supports: { glycemic: 2, iron: 1, ldl: 1 },
    why: { glycemic: 'More fiber than white rice or maida; a slower blood sugar rise.', iron: 'Bajra and ragi add some iron and calcium.', ldl: 'Whole-grain fiber supports cholesterol.' },
    ideas: 'Ragi dosa, bajra or jowar roti; millet khichdi',
  },
  {
    id: 'brown_rice', name: 'Brown rice or quinoa', emoji: '🍚', section: 'Whole grains', group: 'grain3',
    benefit: 'Whole-grain fiber', serving: '½ cup cooked', frequency: 'In place of white rice',
    supports: { glycemic: 1, ldl: 1 },
    why: { glycemic: 'More fiber than white rice; keep portions modest.', ldl: 'Whole-grain fiber supports cholesterol.' },
    ideas: 'Half brown rice with dal; quinoa salad',
  },
  {
    id: 'tofu', name: 'Tofu, soy & edamame', emoji: '🧈', section: 'Protein', group: 'soy',
    benefit: 'Soy protein, low saturated fat', serving: '½ cup / 3–4 oz', frequency: '2–3 times a week',
    supports: { ldl: 2, glycemic: 1, iron: 1 },
    why: { ldl: 'A lean protein that replaces higher-fat meats and cheese.', glycemic: 'Protein steadies blood sugar.', iron: 'Adds some iron.' },
    ideas: 'Tofu bhurji; stir-fry; edamame snack',
  },
  {
    id: 'eggs', name: 'Eggs', emoji: '🥚', section: 'Protein', group: 'eggs', nonVeg: true,
    benefit: 'B12, protein, some vitamin D', serving: '1–2 eggs', frequency: '3–6 times a week',
    supports: { b12: 2, vitd: 1, glycemic: 1 },
    why: { b12: 'A practical daily source of B12.', vitd: 'The yolk contains some vitamin D.', glycemic: 'Protein at breakfast helps steady blood sugar.' },
    ideas: 'Boiled eggs; egg bhurji with spinach; veggie omelette',
  },
  {
    id: 'poultry', name: 'Chicken or lean meat', emoji: '🍗', section: 'Protein', group: 'meat', nonVeg: true,
    benefit: 'Easily absorbed iron, B12, protein', serving: '3–4 oz cooked', frequency: '2–3 times a week',
    supports: { iron: 2, b12: 2, glycemic: 1 },
    why: { iron: 'Heme iron from meat is absorbed better than plant iron.', b12: 'Good B12 source.', glycemic: 'Lean protein steadies blood sugar.' },
    ideas: 'Tandoori or grilled chicken; chicken with vegetables',
  },
  {
    id: 'mushrooms', name: 'UV-exposed mushrooms', emoji: '🍄', section: 'Vegetables', group: 'mushroom',
    benefit: 'Vitamin D (if UV-treated)', serving: '1 cup', frequency: '2–3 times a week',
    supports: { vitd: 2 },
    why: { vitd: 'One of the only plant sources of vitamin D; look for "UV-exposed" on the pack.' },
    ideas: 'Mushroom sabzi; in omelettes, pasta or stir-fries',
  },
  {
    id: 'fortified_cereal', name: 'Fortified low-sugar cereal', emoji: '🥣', section: 'Vitamin/mineral-rich foods', group: 'cereal',
    benefit: 'Added iron, B12, folate', serving: '1 serving', frequency: 'A few times a week',
    supports: { iron: 2, b12: 2, folate: 1, vitd: 1 }, caution: ['glycemic', 'triglycerides'],
    why: { iron: 'Fortified iron adds up, especially with vitamin C.', b12: 'A reliable vegetarian B12 source.', folate: 'Fortified with folic acid.', vitd: 'Some brands add vitamin D.' },
    ideas: 'Bran flakes with fortified milk and orange slices',
    note: 'Pick one with under 6 g sugar per serving.',
  },
  {
    id: 'curd', name: 'Plain yogurt / curd', emoji: '🥣', section: 'Fermented foods', group: 'curd',
    benefit: 'Probiotics, protein, calcium, B12', serving: '¾–1 cup', frequency: 'Daily',
    supports: { b12: 1, glycemic: 1 },
    why: { b12: 'Contains some B12.', glycemic: 'Protein and fat slow carbohydrate absorption at meals.' },
    ideas: 'Curd with lunch; raita; Greek yogurt with berries',
    note: 'Unsweetened.',
  },
  {
    id: 'idli', name: 'Idli or dosa (fermented batter)', emoji: '🫓', section: 'Fermented foods', group: 'idli',
    benefit: 'Fermented lentils and rice', serving: '2–3 idli or 1 dosa', frequency: 'A few times a week',
    supports: { iron: 1, b12: 0 }, caution: ['glycemic'],
    why: { iron: 'Urad dal adds some iron; have with sambar for more legumes and vegetables.' },
    ideas: 'With sambar and vegetables; ragi or oats dosa for more fiber',
  },
  {
    id: 'nutritional_yeast', name: 'B12-fortified nutritional yeast', emoji: '🧂', section: 'Vitamin/mineral-rich foods', group: 'yeast',
    benefit: 'B12 (when fortified)', serving: '1–2 tablespoons', frequency: 'A few times a week',
    supports: { b12: 2, folate: 1 },
    why: { b12: 'A vegetarian B12 source, if the label says fortified.', folate: 'Adds folate.' },
    ideas: 'Sprinkle on popcorn, pasta, eggs or salads',
  },
];

// Foods to limit: only shown when the related need is present.
export const LIMITS = [
  { id: 'sugary_drinks', food: 'Sugary drinks (soda, sweet tea or coffee, energy drinks)', needs: ['glycemic', 'triglycerides'], why: 'Liquid sugar reaches the blood fastest and strongly raises triglycerides.', instead: 'Water, sparkling water with lemon, unsweetened tea or coffee' },
  { id: 'juice', food: 'Fruit juice', needs: ['glycemic', 'triglycerides'], why: 'Concentrated fruit sugar without the fiber.', instead: 'Whole fruit (guava, apple, berries)' },
  { id: 'sweets', food: 'Sweets, desserts and added sugar', needs: ['glycemic', 'triglycerides'], why: 'Raise blood sugar and triglycerides.', instead: 'Fruit, or a small portion on special occasions' },
  { id: 'refined', food: 'Refined white rice in large portions, white bread, maida', needs: ['glycemic', 'triglycerides', 'hdl'], why: 'Low in fiber; acts much like sugar in the blood, and diets heavy in refined carbs tend to lower HDL.', instead: 'Smaller portion of brown rice, quinoa, millet, or whole-wheat roti, plus extra vegetables and dal' },
  { id: 'fried', food: 'Deep-fried snacks and packaged baked goods', needs: ['ldl', 'hdl', 'triglycerides'], why: 'Saturated and trans fats can raise LDL and lower HDL.', instead: 'Roasted chana, nuts, air-fried or baked versions' },
  { id: 'satfat', food: 'Butter, ghee, coconut oil, full-fat cheese, fatty red meat', needs: ['ldl'], why: 'Saturated fat raises LDL cholesterol.', instead: 'Olive, canola or peanut oil (measured); chicken, fish, beans, tofu' },
  { id: 'processed_meat', food: 'Processed meats (bacon, sausage, deli meat)', needs: ['ldl'], why: 'High in saturated fat and salt; linked with heart risk.', instead: 'Grilled chicken, fish, eggs or tofu' },
  { id: 'alcohol', food: 'Alcohol (if you drink)', needs: ['triglycerides', 'glycemic', 'liver'], why: 'Can raise triglycerides sharply and affect blood sugar.', instead: 'Alcohol-free days; ask your clinician what amount is reasonable' },
  { id: 'tea_meals', food: 'Tea or coffee with meals', needs: ['iron'], why: 'Tannins can reduce how much iron you absorb from that meal.', instead: 'Have tea or coffee at least 1 hour before or after meals' },
];

// Simple swaps tailored by need.
export const SWAPS = [
  { needs: ['glycemic', 'triglycerides'], from: 'Soda or packaged juice', to: 'Sparkling water with lemon, or a whole fruit' },
  { needs: ['glycemic', 'triglycerides'], from: 'A full plate of white rice', to: 'Half the rice, plus more vegetables and dal; or brown rice or millet' },
  { needs: ['glycemic'], from: 'Sugar in tea or coffee', to: 'Cut the amount by half, then half again' },
  { needs: ['ldl', 'hdl'], from: 'Butter or ghee for everyday cooking', to: 'Olive, canola or peanut oil, measured' },
  { needs: ['ldl', 'hdl', 'triglycerides'], from: 'Chips, samosa, fried snacks', to: 'Roasted chana, a handful of nuts, or vegetable sticks with hummus' },
  { needs: ['iron'], from: 'Chai with breakfast', to: 'Chai mid-morning; orange or guava with breakfast' },
  { needs: ['iron'], from: 'Plain white rice with dal', to: 'Brown rice or millet with dal and a squeeze of lemon' },
  { needs: ['vitd', 'b12'], from: 'Regular or plain plant milk', to: 'Vitamin D-fortified milk or soy milk' },
];

// Daily plan options. cuisine: Indian | Western | Any
export const MEALS = {
  Morning: [
    { text: 'Your usual tea or coffee now, so it is at least an hour before breakfast', cuisine: 'Any', supports: { iron: 3 } },
    { text: 'Glass of water, then a 10-minute walk outdoors in daylight', cuisine: 'Any', supports: { glycemic: 2, vitd: 1 } },
    { text: '5–6 soaked almonds and 2 walnut halves', cuisine: 'Indian', supports: { hdl: 2, ldl: 2, triglycerides: 1, glycemic: 1 } },
    { text: 'Warm water with lemon (skip sugar or honey)', cuisine: 'Any', supports: { glycemic: 1 } },
    { text: 'Small glass of unsweetened, vitamin D-fortified milk or soy milk', cuisine: 'Western', supports: { vitd: 2, b12: 1 } },
  ],
  Breakfast: [
    { text: 'Vegetable oats upma or savory oats with peas and carrots', cuisine: 'Indian', supports: { ldl: 3, glycemic: 2, triglycerides: 1 } },
    { text: 'Moong dal chilla (2) with mint chutney and curd', cuisine: 'Indian', supports: { glycemic: 2, iron: 2, b12: 1 } },
    { text: 'Ragi dosa with sambar and an orange', cuisine: 'Indian', supports: { iron: 2, glycemic: 1 } },
    { text: 'Steel-cut oats with ground flax, walnuts and berries in unsweetened milk', cuisine: 'Western', supports: { ldl: 3, triglycerides: 2, glycemic: 2, hdl: 1, vitd: 1 } },
    { text: 'Spinach omelette (2 eggs) with a slice of whole-grain toast', cuisine: 'Western', supports: { b12: 2, iron: 1, vitd: 1, glycemic: 1 }, nonVeg: true },
    { text: 'Fortified low-sugar cereal with fortified milk and orange slices', cuisine: 'Western', supports: { iron: 2, b12: 2, vitd: 2 }, caution: ['glycemic', 'triglycerides'] },
  ],
  Lunch: [
    { text: 'Half plate sabzi, 1 cup dal, 1–2 bajra or whole-wheat rotis, curd', cuisine: 'Indian', supports: { glycemic: 2, iron: 2, ldl: 1, b12: 1 } },
    { text: 'Rajma or chana with ½ cup brown rice, kachumber salad with lemon', cuisine: 'Indian', supports: { iron: 3, glycemic: 2, ldl: 2 } },
    { text: 'Palak dal with millet roti and a guava', cuisine: 'Indian', supports: { iron: 3, folate: 2, glycemic: 1 } },
    { text: 'Salmon or sardine salad bowl with quinoa, greens and olive-oil dressing', cuisine: 'Western', supports: { vitd: 3, triglycerides: 3, b12: 2, hdl: 2, ldl: 1 }, nonVeg: true },
    { text: 'Lentil and vegetable soup with a side salad and whole-grain bread', cuisine: 'Western', supports: { glycemic: 2, ldl: 2, iron: 2 } },
    { text: 'Chicken or tofu stir-fry with lots of vegetables and a small portion of brown rice', cuisine: 'Western', supports: { glycemic: 2, ldl: 1, iron: 1, b12: 1 } },
  ],
  'Evening Snack': [
    { text: 'Roasted chana (a small bowl)', cuisine: 'Indian', supports: { glycemic: 2, iron: 1, ldl: 1 } },
    { text: 'Sprouts chaat with lemon, onion and tomato', cuisine: 'Indian', supports: { iron: 2, glycemic: 2, folate: 1 } },
    { text: 'Guava or orange with 1 tbsp roasted pumpkin seeds', cuisine: 'Any', supports: { iron: 3, hdl: 1 } },
    { text: 'Carrot and cucumber sticks with hummus', cuisine: 'Western', supports: { glycemic: 2, ldl: 1 } },
    { text: 'Plain Greek yogurt with berries and chia', cuisine: 'Western', supports: { glycemic: 1, b12: 1, triglycerides: 1 } },
    { text: 'A small handful of walnuts or almonds', cuisine: 'Any', supports: { hdl: 2, ldl: 2, triglycerides: 1 } },
  ],
  Dinner: [
    { text: 'Fish curry (light on oil) with vegetables and a small portion of brown rice', cuisine: 'Indian', supports: { triglycerides: 3, vitd: 3, b12: 2, hdl: 1 }, nonVeg: true },
    { text: 'Tofu or paneer-light bhurji with mixed vegetables and 1 multigrain roti', cuisine: 'Indian', supports: { ldl: 2, glycemic: 2, iron: 1 } },
    { text: 'Egg bhurji with spinach and 1–2 rotis', cuisine: 'Indian', supports: { b12: 2, iron: 2, vitd: 1 }, nonVeg: true },
    { text: 'Moong dal and millet khichdi with extra vegetables and curd', cuisine: 'Indian', supports: { glycemic: 1, iron: 1, b12: 1 } },
    { text: 'Baked salmon with roasted vegetables in olive oil and ½ cup quinoa', cuisine: 'Western', supports: { triglycerides: 3, vitd: 3, b12: 2, hdl: 2, ldl: 1 }, nonVeg: true },
    { text: 'Bean and vegetable chili with a side salad', cuisine: 'Western', supports: { glycemic: 2, ldl: 2, iron: 2 } },
  ],
  'Before Bed': [
    { text: 'Optional: warm unsweetened fortified milk or turmeric milk without sugar', cuisine: 'Indian', supports: { vitd: 2, b12: 1 } },
    { text: 'If hungry, a few nuts rather than sweets; otherwise nothing extra', cuisine: 'Any', supports: { glycemic: 2, triglycerides: 1 } },
    { text: 'Optional: small bowl of plain yogurt', cuisine: 'Western', supports: { b12: 1 } },
  ],
};
