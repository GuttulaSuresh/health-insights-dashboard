import React from 'react';
import { Card, SectionTitle } from './ui.jsx';
import { Plate, NeedsBar } from './Nutrition.jsx';
import FoodPreferences, { VegMark } from './FoodPreferences.jsx';

const SLOT_ICON = { Breakfast: '🍳', Lunch: '🥗', Snack: '🍎', Dinner: '🍲' };
const cuisineLabel = (c) => (c.length > 1 ? 'Indian or Western' : c[0] === 'indian' ? 'Indian' : 'Western');

function MealOption({ meal, alt }) {
  return (
    <div className={alt ? 'meal-option alt' : 'meal-option'}>
      {alt && <div className="muted tiny">Or instead</div>}
      <div><VegMark diet={meal.diet} /> {meal.text}</div>
      <div className="meal-meta">
        <span className="tag">{cuisineLabel(meal.cuisine)}</span>
        {meal.helps.map((h) => <span key={h} className="tag soft">{h}</span>)}
      </div>
      {!alt && meal.facts.length > 0 && <div className="muted tiny">{meal.facts.join(' · ')}</div>}
    </div>
  );
}

export default function MealPlan({ model, prefs, setPrefs }) {
  const plan = model.mealPlans;
  const [day, setDay] = React.useState(0);
  const current = plan[Math.min(day, plan.length - 1)];
  const fr = model.foodRecommendations;
  return (
    <div className="stack">
      <SectionTitle icon="🍽️" title="7-Day Meal Plan" sub={`A rotating week for ${model.profile.name}, built from meals that score best for their results and preferences. Each day is different, and the rotation changes every week.`} />
      <FoodPreferences prefs={prefs} setPrefs={setPrefs} name={model.profile.name} />
      <NeedsBar model={model} />
      <div className="day-tabs" role="tablist" aria-label="Choose a day">
        {plan.map((d, i) => (
          <button key={d.date} role="tab" aria-selected={i === day} className={i === day ? 'active' : ''} onClick={() => setDay(i)}>{d.label}</button>
        ))}
      </div>
      <div className="meal-grid">
        {current.meals.map((s) => (
          <Card key={s.slot} className="meal">
            <h4><span aria-hidden="true">{SLOT_ICON[s.slot]}</span> {s.slot}</h4>
            {s.main ? (
              <>
                <MealOption meal={s.main} />
                {s.alt && <MealOption meal={s.alt} alt />}
              </>
            ) : <p className="muted small">No meal in the library fits all the selected preferences for this slot.</p>}
          </Card>
        ))}
      </div>
      {fr.habits.length > 0 && (
        <Card>
          <h3>Daily habits</h3>
          <ul className="plain">{fr.habits.map((h) => <li key={h.text}>{h.text}</li>)}</ul>
        </Card>
      )}
      <Card>
        <h3>Your plate at lunch and dinner</h3>
        <Plate plate={fr.plate} />
        <ul className="plate-notes">{fr.plate.notes.map((n) => <li key={n}>{n}</li>)}</ul>
      </Card>
      <p className="muted small">These are everyday food ideas, not a prescribed diet. No extreme calorie restriction. If you take medicines for blood sugar, ask your clinician before big changes to meals.</p>
    </div>
  );
}
