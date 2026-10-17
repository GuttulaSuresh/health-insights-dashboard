// Lab-driven needs, foods to limit and swaps. The food library itself is in foodCatalog.js, meals in meals.js.
// Needs: glycemic, triglycerides, ldl, hdl, iron, vitd, b12, folate, liver, kidney.

export const NEED_LABEL = {
  glycemic: 'Blood sugar', triglycerides: 'Triglycerides', ldl: 'LDL / non-HDL cholesterol', hdl: 'HDL cholesterol',
  iron: 'Red cells & iron', vitd: 'Vitamin D', b12: 'Vitamin B12', folate: 'Folate', liver: 'Liver', kidney: 'Kidney',
};

// Foods to limit: only shown when the related need is present.
export const LIMITS = [
  { id: 'sugary_drinks', food: 'Sugary drinks (soda, sweet tea or coffee, energy drinks)', needs: ['glycemic', 'triglycerides'], why: 'Liquid sugar reaches the blood fastest and strongly raises triglycerides.', instead: 'Water, sparkling water with lemon, unsweetened tea or coffee', example: { ndb: '14148', g: 368, serving: '1 can of cola (12 fl oz)' } },
  { id: 'juice', food: 'Fruit juice', needs: ['glycemic', 'triglycerides'], why: 'Concentrated fruit sugar without the fiber.', instead: 'Whole fruit (guava, apple, berries)', example: { ndb: '09206', g: 248, serving: '1 cup of orange juice' } },
  { id: 'sweets', food: 'Sweets, desserts and added sugar', needs: ['glycemic', 'triglycerides'], why: 'Raise blood sugar and triglycerides.', instead: 'Fruit, or a small portion on special occasions', example: { ndb: '18159', g: 30, serving: '2 chocolate chip cookies' } },
  { id: 'refined', food: 'Refined white rice in large portions, white bread, maida', needs: ['glycemic', 'triglycerides', 'hdl'], why: 'Low in fiber; acts much like sugar in the blood, and diets heavy in refined carbs tend to lower HDL.', instead: 'Smaller portion of brown rice, quinoa, millet, or whole-wheat roti, plus extra vegetables and dal', example: { ndb: '20045', g: 158, serving: '1 cup of cooked white rice' } },
  { id: 'fried', food: 'Deep-fried snacks and packaged baked goods', needs: ['ldl', 'hdl', 'triglycerides'], why: 'Saturated and trans fats can raise LDL and lower HDL.', instead: 'Roasted chana, nuts, air-fried or baked versions', example: { ndb: '19411', g: 28, serving: '1 small pack of potato chips (1 oz)' } },
  { id: 'satfat', food: 'Butter, ghee, coconut oil, full-fat cheese, fatty red meat', needs: ['ldl'], why: 'Saturated fat raises LDL cholesterol.', instead: 'Olive, canola or peanut oil (measured); chicken, fish, beans, tofu', example: { ndb: '01003', g: 13, serving: '1 tablespoon of ghee' } },
  { id: 'processed_meat', food: 'Processed meats (bacon, sausage, deli meat)', needs: ['ldl'], why: 'High in saturated fat and salt; linked with heart risk.', instead: 'Grilled chicken, fish, eggs or tofu', example: { ndb: '07089', g: 75, serving: '1 Italian sausage link' } },
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

// Daily habits that are not foods, shown when the related need is present.
export const HABITS = [
  { needs: ['iron'], text: 'Have tea or coffee at least an hour before or after meals, not with them.' },
  { needs: ['vitd'], text: 'Spend 10–15 minutes outdoors in daylight most days, with arms uncovered where practical.' },
  { needs: ['glycemic', 'triglycerides'], text: 'Take a 10-minute walk after your largest meal.' },
  { needs: ['glycemic', 'triglycerides', 'liver'], text: 'Drink water or unsweetened drinks instead of sweet ones.' },
  { needs: ['kidney'], text: 'Go easy on salt and salty snacks; ask your clinician how much fluid suits you.' },
];
