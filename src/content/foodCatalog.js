// Food library for recommendations. Nutrient values are not written here: each food points at a USDA SR28
// entry (`ndb`) and `g` grams per serving, and src/content/usda-nutrients.json supplies the numbers.
//
// diet:       vegan | vegetarian (dairy) | egg | fish | meat
// cuisine:    which meal styles the food is common in (indian, western)
// allergens:  dairy, egg, fish, shellfish, gluten, peanut, treenut, soy, sesame
// omega3:     'marine' (EPA/DHA) or 'ala' (plant). SR28's abbreviated file has no omega-3 column, so this is a
//             classification of well-known sources rather than a measured amount.
// heme:       meat, fish or poultry iron, which is absorbed better than plant iron
// mealOnly:   used to build meals, never suggested on its own
// note:       shown when the food is suggested

const BOTH = ['indian', 'western'];
const IN = ['indian'];
const WE = ['western'];

export const FOOD_SECTIONS = [
  { name: 'Vegetables', icon: '🥬' }, { name: 'Fruits', icon: '🍓' }, { name: 'Whole grains', icon: '🌾' },
  { name: 'Protein', icon: '🫘' }, { name: 'Healthy fats', icon: '🫒' }, { name: 'Nuts and seeds', icon: '🥜' },
  { name: 'Fermented foods', icon: '🥣' }, { name: 'Dairy and fortified foods', icon: '🥛' },
];

const veg = (o) => ({ section: 'Vegetables', diet: 'vegan', cuisine: BOTH, allergens: [], frequency: 'Most days', ...o });
const fruit = (o) => ({ section: 'Fruits', diet: 'vegan', cuisine: BOTH, allergens: [], frequency: '1–2 a day', ...o });
const grain = (o) => ({ section: 'Whole grains', diet: 'vegan', cuisine: BOTH, allergens: [], frequency: 'In place of refined grains', ...o });
const legume = (o) => ({ section: 'Protein', group: 'legume', diet: 'vegan', cuisine: BOTH, allergens: [], frequency: '3–5 times a week', ...o });
const protein = (o) => ({ section: 'Protein', cuisine: BOTH, allergens: [], frequency: '2–3 times a week', ...o });
const nut = (o) => ({ section: 'Nuts and seeds', diet: 'vegan', cuisine: BOTH, allergens: [], frequency: 'Daily', ...o });
const fat = (o) => ({ section: 'Healthy fats', group: 'oil', diet: 'vegan', cuisine: BOTH, allergens: [], frequency: 'As the main cooking fat', ...o });
const dairy = (o) => ({ section: 'Dairy and fortified foods', diet: 'vegetarian', cuisine: BOTH, allergens: ['dairy'], frequency: 'Daily', ...o });

export const FOOD_CATALOG = [
  veg({ id: 'spinach', name: 'Spinach (palak)', emoji: '🥬', ndb: '11458', g: 180, serving: '1 cup cooked', group: 'greens', ideas: { indian: 'Palak dal, palak sabzi', western: 'Sautéed with garlic, in omelettes' } }),
  veg({ id: 'amaranth_leaves', name: 'Amaranth leaves (chaulai)', emoji: '🌿', ndb: '11004', g: 132, serving: '1 cup cooked', group: 'greens', cuisine: IN, ideas: { indian: 'Chaulai or thotakura sabzi, added to dal' } }),
  veg({ id: 'drumstick_leaves', name: 'Moringa leaves (drumstick leaves)', emoji: '🌿', ndb: '11223', g: 60, serving: '½ cup cooked', group: 'greens', cuisine: IN, ideas: { indian: 'Murungai keerai poriyal, in dal or adai' } }),
  veg({ id: 'mustard_greens', name: 'Mustard greens (sarson)', emoji: '🥬', ndb: '11271', g: 140, serving: '1 cup cooked', group: 'greens', ideas: { indian: 'Sarson ka saag with less ghee', western: 'Braised greens with garlic' } }),
  veg({ id: 'kale', name: 'Kale', emoji: '🥬', ndb: '11234', g: 118, serving: '1 cup cooked', group: 'greens', cuisine: WE, ideas: { western: 'Kale salad, sautéed kale, in soups' } }),
  veg({ id: 'broccoli', name: 'Broccoli', emoji: '🥦', ndb: '11091', g: 156, serving: '1 cup cooked', group: 'crucifer', ideas: { indian: 'Broccoli stir-fry with garlic', western: 'Steamed or roasted broccoli' } }),
  veg({ id: 'cauliflower', name: 'Cauliflower (gobhi)', emoji: '🥦', ndb: '11136', g: 124, serving: '1 cup cooked', group: 'crucifer', ideas: { indian: 'Gobhi sabzi, in sambar', western: 'Roasted cauliflower, cauliflower rice' } }),
  veg({ id: 'cabbage', name: 'Cabbage (patta gobhi)', emoji: '🥬', ndb: '11110', g: 150, serving: '1 cup cooked', group: 'crucifer', ideas: { indian: 'Cabbage poriyal or thoran', western: 'Slaw with yogurt dressing' } }),
  veg({ id: 'brussels_sprouts', name: 'Brussels sprouts', emoji: '🥬', ndb: '11099', g: 156, serving: '1 cup cooked', group: 'crucifer', cuisine: WE, ideas: { western: 'Roasted with olive oil' } }),
  veg({ id: 'okra', name: 'Okra (bhindi)', emoji: '🫛', ndb: '11279', g: 160, serving: '1 cup cooked', group: 'pod', ideas: { indian: 'Bhindi sabzi with little oil', western: 'Roasted okra, in gumbo' } }),
  veg({ id: 'green_beans', name: 'Green beans', emoji: '🫛', ndb: '11053', g: 125, serving: '1 cup cooked', group: 'pod', ideas: { indian: 'Beans poriyal or foogath', western: 'Steamed green beans with lemon' } }),
  veg({ id: 'bitter_gourd', name: 'Bitter gourd (karela)', emoji: '🥒', ndb: '11025', g: 124, serving: '1 cup cooked', group: 'gourd', cuisine: IN, ideas: { indian: 'Karela sabzi, stuffed karela' } }),
  veg({ id: 'bottle_gourd', name: 'Bottle gourd (lauki)', emoji: '🥒', ndb: '11219', g: 146, serving: '1 cup cooked', group: 'gourd', cuisine: IN, ideas: { indian: 'Lauki chana dal, lauki kofta (baked)' } }),
  veg({ id: 'eggplant', name: 'Eggplant (baingan)', emoji: '🍆', ndb: '11210', g: 99, serving: '1 cup cooked', group: 'nightshade', ideas: { indian: 'Baingan bharta with little oil', western: 'Grilled eggplant, ratatouille' } }),
  veg({ id: 'red_pepper', name: 'Red bell pepper', emoji: '🫑', ndb: '11821', g: 119, serving: '1 cup chopped', group: 'pepper', ideas: { indian: 'Shimla mirch sabzi, in stir-fries', western: 'Raw strips, roasted peppers' } }),
  veg({ id: 'tomato', name: 'Tomato', emoji: '🍅', ndb: '11529', g: 123, serving: '1 medium', group: 'nightshade', ideas: { indian: 'Kachumber, tomato rasam', western: 'Salads, tomato soup' } }),
  veg({ id: 'carrot', name: 'Carrot', emoji: '🥕', ndb: '11124', g: 61, serving: '1 medium', group: 'root', ideas: { indian: 'Carrot poriyal, gajar in sabzi', western: 'Raw sticks, roasted carrots' } }),
  veg({ id: 'beetroot', name: 'Beetroot', emoji: '🫜', ndb: '11081', g: 170, serving: '1 cup cooked', group: 'root', ideas: { indian: 'Beetroot poriyal, raita', western: 'Roasted beet salad' } }),
  veg({ id: 'radish', name: 'Radish (mooli)', emoji: '🥕', ndb: '11429', g: 116, serving: '1 cup sliced', group: 'root', ideas: { indian: 'Mooli salad, mooli sabzi', western: 'Sliced into salads' } }),
  veg({ id: 'cucumber', name: 'Cucumber', emoji: '🥒', ndb: '11205', g: 104, serving: '1 cup sliced', group: 'salad', ideas: { indian: 'Kachumber, cucumber raita', western: 'Salads, with hummus' } }),
  veg({ id: 'romaine', name: 'Romaine lettuce', emoji: '🥗', ndb: '11251', g: 94, serving: '2 cups shredded', group: 'salad', cuisine: WE, ideas: { western: 'Salad base, in wraps' } }),
  veg({ id: 'zucchini', name: 'Zucchini', emoji: '🥒', ndb: '11478', g: 180, serving: '1 cup cooked', group: 'squash', cuisine: WE, ideas: { western: 'Sautéed zucchini, zucchini noodles' } }),
  veg({ id: 'asparagus', name: 'Asparagus', emoji: '🌱', ndb: '11012', g: 180, serving: '1 cup cooked', group: 'asparagus', cuisine: WE, ideas: { western: 'Roasted or grilled asparagus' } }),
  veg({ id: 'peas', name: 'Green peas (matar)', emoji: '🫛', ndb: '11305', g: 160, serving: '1 cup cooked', group: 'peas', frequency: 'A few times a week', ideas: { indian: 'Matar in upma, pulao or sabzi', western: 'Pea soup, in pasta' } }),
  veg({ id: 'pumpkin', name: 'Pumpkin (kaddu)', emoji: '🎃', ndb: '11423', g: 245, serving: '1 cup cooked', group: 'squash', ideas: { indian: 'Kaddu sabzi, pumpkin sambar', western: 'Pumpkin soup' } }),
  veg({ id: 'sweet_potato', name: 'Sweet potato', emoji: '🍠', ndb: '11508', g: 114, serving: '1 medium, baked', group: 'starchy_veg', frequency: 'A few times a week', ideas: { indian: 'Shakarkandi chaat with lemon', western: 'Baked sweet potato' } }),
  veg({ id: 'uv_mushrooms', name: 'UV-exposed mushrooms', emoji: '🍄', ndb: '11938', g: 70, serving: '1 cup sliced', group: 'mushroom', frequency: '2–3 times a week', note: 'Only mushrooms labeled "UV-exposed" or "high in vitamin D" have this much vitamin D.', ideas: { indian: 'Mushroom matar, mushroom sabzi', western: 'In omelettes, pasta or stir-fries' } }),

  fruit({ id: 'guava', name: 'Guava', emoji: '🍐', ndb: '09139', g: 55, serving: '1 fruit', group: 'vitc_fruit', ideas: { indian: 'After lunch, with a pinch of chaat masala', western: 'Sliced as a snack' } }),
  fruit({ id: 'orange', name: 'Orange', emoji: '🍊', ndb: '09200', g: 140, serving: '1 medium', group: 'citrus', ideas: { indian: 'Santra with breakfast', western: 'With breakfast or as a snack' } }),
  fruit({ id: 'lemon', name: 'Lemon or lime juice', emoji: '🍋', ndb: '09152', g: 24, serving: 'Juice of ½ lemon', group: 'citrus', frequency: 'With iron-rich meals', ideas: { indian: 'Squeezed on dal, sprouts and sabzi', western: 'On salads, beans and fish' } }),
  fruit({ id: 'papaya', name: 'Papaya', emoji: '🥭', ndb: '09226', g: 145, serving: '1 cup cubes', group: 'tropical', ideas: { indian: 'Papaya with lemon in the morning', western: 'In fruit salads' } }),
  fruit({ id: 'apple', name: 'Apple', emoji: '🍎', ndb: '09003', g: 182, serving: '1 medium, with skin', group: 'pome', ideas: { indian: 'With a few nuts as a snack', western: 'With peanut butter, in oats' } }),
  fruit({ id: 'pear', name: 'Pear', emoji: '🍐', ndb: '09252', g: 178, serving: '1 medium', group: 'pome', ideas: { indian: 'As an evening snack', western: 'With cottage cheese or walnuts' } }),
  fruit({ id: 'strawberries', name: 'Strawberries', emoji: '🍓', ndb: '09316', g: 152, serving: '1 cup', group: 'berry', ideas: { indian: 'With curd', western: 'With yogurt or oats' } }),
  fruit({ id: 'blueberries', name: 'Blueberries', emoji: '🫐', ndb: '09050', g: 148, serving: '1 cup', group: 'berry', cuisine: WE, ideas: { western: 'On oats or yogurt' } }),
  fruit({ id: 'banana', name: 'Banana', emoji: '🍌', ndb: '09040', g: 118, serving: '1 medium', group: 'tropical', ideas: { indian: 'Before a walk or workout', western: 'Sliced on toast or oats' } }),
  fruit({ id: 'pomegranate', name: 'Pomegranate (anar)', emoji: '🍎', ndb: '09286', g: 87, serving: '½ cup seeds', group: 'pomegranate', ideas: { indian: 'In raita, chaat or salads', western: 'On salads and yogurt' } }),
  fruit({ id: 'kiwi', name: 'Kiwi', emoji: '🥝', ndb: '09148', g: 69, serving: '1 fruit', group: 'vitc_fruit', ideas: { indian: 'As a snack', western: 'Sliced, with breakfast' } }),
  fruit({ id: 'mango', name: 'Mango', emoji: '🥭', ndb: '09176', g: 165, serving: '1 cup sliced', group: 'tropical', frequency: 'A few times a week, in season', ideas: { indian: 'A small bowl after a meal', western: 'In smoothies or salsa' } }),
  fruit({ id: 'watermelon', name: 'Watermelon', emoji: '🍉', ndb: '09326', g: 152, serving: '1 cup cubes', group: 'melon', ideas: { indian: 'Tarbooz as a summer snack', western: 'Chilled cubes' } }),
  fruit({ id: 'grapes', name: 'Grapes', emoji: '🍇', ndb: '09132', g: 151, serving: '1 cup', group: 'grape', ideas: { indian: 'A small bowl as a snack', western: 'With a few nuts' } }),
  fruit({ id: 'jamun', name: 'Jamun (Java plum)', emoji: '🫐', ndb: '09145', g: 100, serving: 'About 15 fruits', group: 'berry', cuisine: IN, frequency: 'In season', ideas: { indian: 'Fresh jamun with a pinch of salt' } }),
  fruit({ id: 'jackfruit', name: 'Jackfruit (kathal)', emoji: '🍈', ndb: '09144', g: 165, serving: '1 cup pieces', group: 'tropical', cuisine: IN, frequency: 'In season', ideas: { indian: 'Ripe pieces as a snack; raw kathal as a sabzi' } }),
  fruit({ id: 'chikoo', name: 'Chikoo (sapodilla)', emoji: '🥔', ndb: '09313', g: 170, serving: '1 fruit', group: 'tropical', cuisine: IN, frequency: 'Occasionally', ideas: { indian: 'As a snack' } }),
  fruit({ id: 'custard_apple', name: 'Custard apple (sitaphal)', emoji: '🍏', ndb: '09321', g: 100, serving: '½ fruit', group: 'tropical', cuisine: IN, frequency: 'In season', ideas: { indian: 'Fresh sitaphal' } }),
  fruit({ id: 'cherries', name: 'Cherries', emoji: '🍒', ndb: '09070', g: 138, serving: '1 cup', group: 'berry', cuisine: WE, frequency: 'In season', ideas: { western: 'Fresh, or on yogurt' } }),
  fruit({ id: 'dates', name: 'Dates (khajur)', emoji: '🌴', ndb: '09421', g: 48, serving: '2 dates', group: 'dried_fruit', frequency: 'Occasionally', note: 'Naturally high in sugar; keep to 1–2.', ideas: { indian: 'One or two as a sweet instead of mithai', western: 'Stuffed with a walnut' } }),
  fruit({ id: 'dried_figs', name: 'Dried figs (anjeer)', emoji: '🟤', ndb: '09094', g: 40, serving: '2–3 figs', group: 'dried_fruit', frequency: 'A few times a week', ideas: { indian: 'Soaked anjeer in the morning', western: 'With nuts as a snack' } }),
  fruit({ id: 'raisins', name: 'Raisins (kishmish)', emoji: '🍇', ndb: '09298', g: 30, serving: '2 tablespoons', group: 'dried_fruit', frequency: 'Occasionally', ideas: { indian: 'Soaked kishmish', western: 'In oats' } }),

  grain({ id: 'oats', name: 'Oats', emoji: '🥣', ndb: '08120', g: 40, serving: '½ cup dry', group: 'oats', frequency: 'Most days', ideas: { indian: 'Vegetable oats upma, oats chilla', western: 'Porridge or overnight oats' } }),
  grain({ id: 'barley', name: 'Barley (jau)', emoji: '🌾', ndb: '20006', g: 157, serving: '1 cup cooked', group: 'barley', allergens: ['gluten'], ideas: { indian: 'Jau khichdi or jau roti', western: 'In soups and salads' } }),
  grain({ id: 'brown_rice', name: 'Brown rice', emoji: '🍚', ndb: '20037', g: 98, serving: '½ cup cooked', group: 'rice', ideas: { indian: 'Half brown rice with dal and sabzi', western: 'In grain bowls and stir-fries' } }),
  grain({ id: 'white_rice', name: 'White rice', emoji: '🍚', ndb: '20045', g: 79, serving: '½ cup cooked', group: 'rice', mealOnly: true }),
  grain({ id: 'quinoa', name: 'Quinoa', emoji: '🍚', ndb: '20137', g: 92, serving: '½ cup cooked', group: 'quinoa', ideas: { indian: 'Quinoa pulao or upma', western: 'Quinoa salad or bowl' } }),
  grain({ id: 'millet', name: 'Millet (bajra or proso), cooked', emoji: '🌾', ndb: '20032', g: 87, serving: '½ cup cooked', group: 'millet', ideas: { indian: 'Millet khichdi or pongal', western: 'As a side instead of rice' } }),
  grain({ id: 'millet_roti', name: 'Bajra roti (millet flour)', emoji: '🫓', ndb: '20647', g: 30, serving: '1 roti (¼ cup flour)', group: 'millet', cuisine: IN, ideas: { indian: 'Bajra roti with sabzi and dal' } }),
  grain({ id: 'jowar_roti', name: 'Jowar roti (sorghum flour)', emoji: '🫓', ndb: '20648', g: 30, serving: '1 roti (¼ cup flour)', group: 'sorghum', cuisine: IN, ideas: { indian: 'Jowar bhakri with dal or sabzi' } }),
  grain({ id: 'roti', name: 'Whole-wheat roti (chapati)', emoji: '🫓', ndb: '28285', g: 40, serving: '1 roti', group: 'wheat', cuisine: IN, allergens: ['gluten'], frequency: '1–2 per meal', ideas: { indian: 'With dal and sabzi; add methi or bran to the dough' } }),
  grain({ id: 'wholewheat_bread', name: 'Whole-wheat bread', emoji: '🍞', ndb: '18075', g: 32, serving: '1 slice', group: 'wheat', cuisine: WE, allergens: ['gluten'], frequency: '1–2 slices a meal', ideas: { western: 'Toast with eggs, avocado or peanut butter' } }),
  grain({ id: 'wholewheat_pasta', name: 'Whole-wheat pasta', emoji: '🍝', ndb: '20125', g: 70, serving: '½ cup cooked', group: 'wheat', cuisine: WE, allergens: ['gluten'], ideas: { western: 'With vegetables and a lentil or tomato sauce' } }),
  grain({ id: 'dalia', name: 'Dalia (broken wheat, bulgur)', emoji: '🥣', ndb: '20013', g: 91, serving: '½ cup cooked', group: 'wheat', allergens: ['gluten'], ideas: { indian: 'Vegetable dalia or dalia khichdi', western: 'Tabbouleh, bulgur salad' } }),
  grain({ id: 'buckwheat', name: 'Buckwheat (kuttu)', emoji: '🌾', ndb: '20010', g: 84, serving: '½ cup cooked', group: 'buckwheat', ideas: { indian: 'Kuttu cheela or khichdi', western: 'Buckwheat porridge or kasha' } }),
  grain({ id: 'amaranth_grain', name: 'Amaranth grain (rajgira)', emoji: '🌾', ndb: '20002', g: 123, serving: '½ cup cooked', group: 'amaranth', cuisine: IN, ideas: { indian: 'Rajgira porridge, rajgira roti' } }),
  grain({ id: 'popcorn', name: 'Air-popped popcorn', emoji: '🍿', ndb: '19806', g: 16, serving: '2 cups', group: 'popcorn', section: 'Whole grains', frequency: 'As a snack', ideas: { indian: 'With a pinch of chaat masala', western: 'Plain or lightly seasoned' } }),

  legume({ id: 'lentils', name: 'Lentils (masoor dal)', emoji: '🍲', ndb: '16070', g: 99, serving: '½ cup cooked', ideas: { indian: 'Masoor dal with lemon', western: 'Lentil soup or salad' } }),
  legume({ id: 'moong', name: 'Moong dal (mung beans)', emoji: '🍲', ndb: '16081', g: 101, serving: '½ cup cooked', ideas: { indian: 'Moong dal, moong chilla, khichdi', western: 'Mung bean soup or curry' } }),
  legume({ id: 'urad', name: 'Urad dal (black gram)', emoji: '🍲', ndb: '16084', g: 90, serving: '½ cup cooked', cuisine: IN, ideas: { indian: 'Dal makhani (light on cream), idli and dosa batter' } }),
  legume({ id: 'toor', name: 'Toor dal (pigeon peas)', emoji: '🍲', ndb: '16102', g: 84, serving: '½ cup cooked', cuisine: IN, ideas: { indian: 'Sambar, plain toor dal' } }),
  legume({ id: 'chickpeas', name: 'Chickpeas (chana)', emoji: '🫘', ndb: '16057', g: 82, serving: '½ cup cooked', ideas: { indian: 'Chana masala, roasted chana, chana chaat', western: 'Chickpea salad, roasted chickpeas' } }),
  legume({ id: 'rajma', name: 'Kidney beans (rajma)', emoji: '🫘', ndb: '16033', g: 89, serving: '½ cup cooked', ideas: { indian: 'Rajma with brown rice', western: 'Bean chili' } }),
  legume({ id: 'lobia', name: 'Black-eyed peas (lobia)', emoji: '🫘', ndb: '16063', g: 86, serving: '½ cup cooked', ideas: { indian: 'Lobia curry, lobia salad', western: 'Black-eyed pea salad' } }),
  legume({ id: 'black_beans', name: 'Black beans', emoji: '🫘', ndb: '16015', g: 86, serving: '½ cup cooked', cuisine: WE, ideas: { western: 'Burrito bowls, black bean soup' } }),
  legume({ id: 'split_peas', name: 'Split peas', emoji: '🍲', ndb: '16086', g: 98, serving: '½ cup cooked', cuisine: WE, ideas: { western: 'Split pea soup' } }),
  legume({ id: 'navy_beans', name: 'White beans', emoji: '🫘', ndb: '16038', g: 91, serving: '½ cup cooked', cuisine: WE, ideas: { western: 'White bean salad, minestrone' } }),
  legume({ id: 'sprouts', name: 'Mung bean sprouts', emoji: '🌱', ndb: '11043', g: 104, serving: '1 cup', ideas: { indian: 'Sprouts chaat with lemon', western: 'In salads and stir-fries' } }),
  legume({ id: 'besan', name: 'Chickpea flour (besan)', emoji: '🫓', ndb: '16157', g: 30, serving: '¼ cup (for 2 chillas)', cuisine: IN, ideas: { indian: 'Besan chilla with vegetables' } }),
  legume({ id: 'soybeans', name: 'Soybeans', emoji: '🫘', ndb: '16109', g: 86, serving: '½ cup cooked', group: 'soy', allergens: ['soy'], frequency: '2–3 times a week', ideas: { indian: 'Soybean curry, soy chunks pulao', western: 'In stews and salads' } }),
  legume({ id: 'tofu', name: 'Tofu', emoji: '🧈', ndb: '16126', g: 126, serving: '½ cup', group: 'soy', allergens: ['soy'], frequency: '2–3 times a week', ideas: { indian: 'Tofu bhurji, tofu tikka', western: 'Tofu scramble or stir-fry' } }),
  legume({ id: 'tempeh', name: 'Tempeh', emoji: '🧈', ndb: '16114', g: 83, serving: '½ cup', group: 'soy', allergens: ['soy'], cuisine: WE, frequency: '2–3 times a week', ideas: { western: 'Tempeh stir-fry or sandwich' } }),
  legume({ id: 'edamame', name: 'Edamame', emoji: '🫛', ndb: '11212', g: 78, serving: '½ cup shelled', group: 'soy', allergens: ['soy'], cuisine: WE, frequency: 'A few times a week', ideas: { western: 'Steamed as a snack' } }),
  legume({ id: 'hummus', name: 'Hummus', emoji: '🥙', ndb: '16158', g: 60, serving: '¼ cup', group: 'hummus', allergens: ['sesame'], cuisine: WE, frequency: 'A few times a week', ideas: { western: 'With vegetable sticks or in a wrap' } }),

  dairy({ id: 'milk', name: 'Low-fat milk with vitamin D', emoji: '🥛', ndb: '01082', g: 244, serving: '1 cup', group: 'milk', note: 'Check the label says "vitamin D added"; amounts vary by country and brand.', ideas: { indian: 'In oats or as haldi doodh without sugar', western: 'With cereal or in coffee' } }),
  dairy({ id: 'soy_milk', name: 'Fortified soy milk, unsweetened', emoji: '🥛', ndb: '16222', g: 243, serving: '1 cup', group: 'milk', diet: 'vegan', allergens: ['soy'], note: 'Choose one fortified with vitamins D and B12.', ideas: { indian: 'In tea, oats or smoothies', western: 'With cereal or in coffee' } }),
  dairy({ id: 'almond_milk', name: 'Almond milk, unsweetened', emoji: '🥛', ndb: '14091', g: 240, serving: '1 cup', group: 'milk', diet: 'vegan', allergens: ['treenut'], cuisine: WE, note: 'Low in protein; pick a fortified one.', ideas: { western: 'In smoothies, oats or coffee' } }),
  dairy({ id: 'greek_yogurt', name: 'Greek yogurt, plain', emoji: '🥣', ndb: '01256', g: 170, serving: '¾ cup', group: 'yogurt', section: 'Fermented foods', cuisine: WE, ideas: { western: 'With berries and nuts' } }),
  dairy({ id: 'curd', name: 'Curd (plain yogurt)', emoji: '🥣', ndb: '01117', g: 184, serving: '¾ cup', group: 'yogurt', section: 'Fermented foods', ideas: { indian: 'With lunch, as raita', western: 'Plain yogurt with fruit' } }),
  dairy({ id: 'buttermilk', name: 'Buttermilk (chaas)', emoji: '🥛', ndb: '01088', g: 245, serving: '1 glass', group: 'buttermilk', section: 'Fermented foods', ideas: { indian: 'Masala chaas after lunch', western: 'In smoothies or pancakes' } }),
  dairy({ id: 'cottage_cheese', name: 'Cottage cheese, low-fat', emoji: '🧀', ndb: '01016', g: 113, serving: '½ cup', group: 'cheese', cuisine: WE, ideas: { western: 'With fruit, or on toast' } }),
  dairy({ id: 'paneer', name: 'Paneer', emoji: '🧀', ndb: '01228', g: 50, serving: '50 g', group: 'cheese', cuisine: IN, frequency: 'A few times a week', note: 'Values are for queso fresco, a similar fresh cheese; SR28 has no paneer entry.', ideas: { indian: 'Paneer bhurji, paneer tikka' } }),
  dairy({ id: 'ricotta', name: 'Ricotta, part-skim', emoji: '🧀', ndb: '01037', g: 62, serving: '¼ cup', group: 'cheese', cuisine: WE, frequency: 'A few times a week', ideas: { western: 'In pasta or on toast' } }),

  protein({ id: 'eggs', name: 'Eggs', emoji: '🥚', ndb: '01129', g: 100, serving: '2 eggs', group: 'egg', diet: 'egg', allergens: ['egg'], frequency: '3–6 times a week', ideas: { indian: 'Egg bhurji with spinach, egg curry', western: 'Boiled eggs, vegetable omelette' } }),
  protein({ id: 'egg_whites', name: 'Egg whites', emoji: '🥚', ndb: '01124', g: 66, serving: '2 egg whites', group: 'egg', diet: 'egg', allergens: ['egg'], ideas: { indian: 'Egg-white bhurji', western: 'Egg-white omelette' } }),
  protein({ id: 'salmon', name: 'Salmon', emoji: '🐟', ndb: '15237', g: 85, serving: '3 oz cooked', group: 'fatty_fish', diet: 'fish', allergens: ['fish'], omega3: 'marine', heme: true, cuisine: WE, ideas: { western: 'Baked salmon, salmon salad' } }),
  protein({ id: 'sardines', name: 'Sardines', emoji: '🐟', ndb: '15088', g: 85, serving: '3 oz', group: 'fatty_fish', diet: 'fish', allergens: ['fish'], omega3: 'marine', heme: true, ideas: { indian: 'Mathi fry (pan-roasted) or curry', western: 'Sardines on whole-grain toast' } }),
  protein({ id: 'mackerel', name: 'Mackerel (bangda)', emoji: '🐟', ndb: '15047', g: 85, serving: '3 oz cooked', group: 'fatty_fish', diet: 'fish', allergens: ['fish'], omega3: 'marine', heme: true, ideas: { indian: 'Bangda curry or tawa fry with little oil', western: 'Grilled mackerel' } }),
  protein({ id: 'trout', name: 'Trout', emoji: '🐟', ndb: '15241', g: 85, serving: '3 oz cooked', group: 'fatty_fish', diet: 'fish', allergens: ['fish'], omega3: 'marine', heme: true, cuisine: WE, ideas: { western: 'Baked trout with lemon' } }),
  protein({ id: 'tuna', name: 'Tuna, canned light', emoji: '🐟', ndb: '15121', g: 85, serving: '3 oz', group: 'lean_fish', diet: 'fish', allergens: ['fish'], heme: true, cuisine: WE, ideas: { western: 'Tuna and bean salad' } }),
  protein({ id: 'carp', name: 'Rohu or katla (carp)', emoji: '🐟', ndb: '15009', g: 85, serving: '3 oz cooked', group: 'lean_fish', diet: 'fish', allergens: ['fish'], heme: true, cuisine: IN, ideas: { indian: 'Macher jhol, fish curry with little oil' } }),
  protein({ id: 'cod', name: 'Cod', emoji: '🐟', ndb: '15016', g: 85, serving: '3 oz cooked', group: 'lean_fish', diet: 'fish', allergens: ['fish'], heme: true, cuisine: WE, ideas: { western: 'Baked cod with vegetables' } }),
  protein({ id: 'tilapia', name: 'Tilapia', emoji: '🐟', ndb: '15262', g: 85, serving: '3 oz cooked', group: 'lean_fish', diet: 'fish', allergens: ['fish'], heme: true, ideas: { indian: 'Tawa fish with little oil', western: 'Grilled tilapia' } }),
  protein({ id: 'shrimp', name: 'Prawns or shrimp', emoji: '🦐', ndb: '15271', g: 85, serving: '3 oz cooked', group: 'shellfish', diet: 'fish', allergens: ['shellfish'], heme: true, ideas: { indian: 'Prawn curry, prawn masala', western: 'Garlic shrimp, shrimp salad' } }),
  protein({ id: 'mussels', name: 'Mussels', emoji: '🦪', ndb: '15165', g: 85, serving: '3 oz cooked', group: 'shellfish', diet: 'fish', allergens: ['shellfish'], heme: true, ideas: { indian: 'Kallummakkaya (mussel) roast', western: 'Steamed mussels' } }),
  protein({ id: 'chicken_breast', name: 'Chicken breast', emoji: '🍗', ndb: '05064', g: 85, serving: '3 oz cooked', group: 'poultry', diet: 'meat', heme: true, ideas: { indian: 'Tandoori chicken, chicken curry with little oil', western: 'Grilled chicken' } }),
  protein({ id: 'chicken_thigh', name: 'Chicken thigh, skinless', emoji: '🍗', ndb: '05098', g: 85, serving: '3 oz cooked', group: 'poultry', diet: 'meat', heme: true, ideas: { indian: 'Chicken curry, chicken tikka', western: 'Roast chicken' } }),
  protein({ id: 'chicken_liver', name: 'Chicken liver', emoji: '🍗', ndb: '05028', g: 85, serving: '3 oz cooked', group: 'organ', diet: 'meat', heme: true, frequency: 'Once a week at most', note: 'Very high in vitamin A; keep portions small and avoid during pregnancy unless advised.', ideas: { indian: 'Kaleji masala', western: 'Pan-fried livers with onions' } }),
  protein({ id: 'turkey', name: 'Turkey breast', emoji: '🦃', ndb: '05220', g: 85, serving: '3 oz cooked', group: 'poultry', diet: 'meat', heme: true, cuisine: WE, ideas: { western: 'Roast turkey, turkey sandwich' } }),
  protein({ id: 'lean_beef', name: 'Lean beef (sirloin)', emoji: '🥩', ndb: '13454', g: 85, serving: '3 oz cooked', group: 'red_meat', diet: 'meat', heme: true, cuisine: WE, frequency: 'Once a week or less', ideas: { western: 'Grilled lean steak with vegetables' } }),
  protein({ id: 'goat', name: 'Goat meat (mutton)', emoji: '🍖', ndb: '17169', g: 85, serving: '3 oz cooked', group: 'red_meat', diet: 'meat', heme: true, cuisine: IN, frequency: 'Once a week or less', ideas: { indian: 'Mutton curry with little oil' } }),

  nut({ id: 'almonds', name: 'Almonds (badam)', emoji: '🌰', ndb: '12061', g: 28, serving: '1 handful (about 23)', group: 'nuts', allergens: ['treenut'], ideas: { indian: 'Soaked badam in the morning', western: 'Snack, or on oats' } }),
  nut({ id: 'walnuts', name: 'Walnuts (akhrot)', emoji: '🌰', ndb: '12155', g: 28, serving: '7 halves', group: 'nuts', allergens: ['treenut'], omega3: 'ala', ideas: { indian: 'Snack with an apple', western: 'On oats and salads' } }),
  nut({ id: 'pistachios', name: 'Pistachios', emoji: '🥜', ndb: '12152', g: 28, serving: '1 handful (about 49)', group: 'nuts', allergens: ['treenut'], ideas: { indian: 'Unsalted pista as a snack', western: 'On yogurt or salads' } }),
  nut({ id: 'cashews', name: 'Cashews (kaju)', emoji: '🥜', ndb: '12085', g: 28, serving: '1 handful (about 18)', group: 'nuts', allergens: ['treenut'], ideas: { indian: 'A few unsalted kaju', western: 'In stir-fries' } }),
  nut({ id: 'peanuts', name: 'Peanuts (moongphali)', emoji: '🥜', ndb: '16390', g: 28, serving: '1 handful', group: 'peanut', allergens: ['peanut'], ideas: { indian: 'Roasted peanuts, in poha or chaat', western: 'Unsalted, as a snack' } }),
  nut({ id: 'peanut_butter', name: 'Peanut butter, no salt or sugar added', emoji: '🥜', ndb: '16398', g: 32, serving: '2 tablespoons', group: 'peanut', allergens: ['peanut'], cuisine: WE, ideas: { western: 'On whole-grain toast or apple slices' } }),
  nut({ id: 'flaxseed', name: 'Ground flaxseed (alsi)', emoji: '🌱', ndb: '12220', g: 14, serving: '2 tablespoons', group: 'omega_seeds', omega3: 'ala', ideas: { indian: 'In roti dough, curd or chutney', western: 'Stirred into oats or smoothies' } }),
  nut({ id: 'chia', name: 'Chia seeds', emoji: '🌱', ndb: '12006', g: 12, serving: '1 tablespoon', group: 'omega_seeds', omega3: 'ala', ideas: { indian: 'In nimbu pani or curd', western: 'Chia pudding, in oats' } }),
  nut({ id: 'pumpkin_seeds', name: 'Pumpkin seeds', emoji: '🎃', ndb: '12014', g: 16, serving: '2 tablespoons', group: 'seeds', ideas: { indian: 'Roasted, on salads or chaat', western: 'On salads and oats' } }),
  nut({ id: 'sesame', name: 'Sesame seeds (til)', emoji: '🌱', ndb: '12023', g: 9, serving: '1 tablespoon', group: 'seeds', allergens: ['sesame'], ideas: { indian: 'Til chutney, sprinkled on sabzi', western: 'On stir-fries and salads' } }),
  nut({ id: 'sunflower_seeds', name: 'Sunflower seeds', emoji: '🌻', ndb: '12036', g: 14, serving: '2 tablespoons', group: 'seeds', ideas: { indian: 'Roasted, in trail mix', western: 'On salads' } }),
  nut({ id: 'makhana', name: 'Makhana (lotus seeds)', emoji: '⚪', ndb: '12013', g: 32, serving: '1 cup', group: 'makhana', cuisine: IN, frequency: 'As a snack', ideas: { indian: 'Dry-roasted makhana with a pinch of salt' } }),

  fat({ id: 'olive_oil', name: 'Olive oil', emoji: '🫒', ndb: '04053', g: 13.5, serving: '1 tablespoon', ideas: { indian: 'For tadka and sabzi, measured', western: 'Salad dressing and roasting' } }),
  fat({ id: 'canola_oil', name: 'Canola (rapeseed) oil', emoji: '🫗', ndb: '04582', g: 14, serving: '1 tablespoon', omega3: 'ala', ideas: { indian: 'Everyday cooking oil', western: 'Baking and stir-frying' } }),
  fat({ id: 'peanut_oil', name: 'Groundnut (peanut) oil', emoji: '🫗', ndb: '04042', g: 13.5, serving: '1 tablespoon', allergens: ['peanut'], ideas: { indian: 'Everyday cooking oil', western: 'Stir-frying' } }),
  fat({ id: 'mustard_oil', name: 'Mustard oil', emoji: '🫗', ndb: '04583', g: 14, serving: '1 tablespoon', cuisine: IN, omega3: 'ala', ideas: { indian: 'Traditional cooking oil in eastern and northern India' } }),
  fat({ id: 'avocado', name: 'Avocado', emoji: '🥑', ndb: '09037', g: 50, serving: '⅓ avocado', group: 'avocado', frequency: '3–4 times a week', ideas: { indian: 'In raita or chaat', western: 'On toast or in salads' } }),

  dairy({ id: 'fortified_oats', name: 'Fortified instant oats, plain', emoji: '🥣', ndb: '08122', g: 28, serving: '1 packet, dry', group: 'cereal', diet: 'vegan', allergens: [], frequency: 'A few times a week', note: 'Pick plain packets; flavored ones add sugar.', ideas: { indian: 'Masala oats with vegetables', western: 'With milk and fruit' } }),
];

export const FOOD_BY_ID = Object.fromEntries(FOOD_CATALOG.map((f) => [f.id, f]));
