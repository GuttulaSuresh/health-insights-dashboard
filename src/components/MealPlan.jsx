import React from 'react';
import { Card, SectionTitle } from './ui.jsx';
import { dailyPlan } from '../lib/nutrition.js';
import { VegToggle, Plate, NeedsBar } from './Nutrition.jsx';

const SLOT_ICON = { Morning: '🌅', Breakfast: '🍳', Lunch: '🥗', 'Evening Snack': '🍎', Dinner: '🍲', 'Before Bed': '🌙' };

export default function MealPlan({ model, vegetarian, setVegetarian }) {
  const plan = React.useMemo(() => dailyPlan(model.foodRecommendations.needs, { vegetarian }), [model, vegetarian]);
  return (
    <div className="stack">
      <SectionTitle icon="🍽️" title="What Should I Eat Starting Today?" sub={`A simple day for ${model.profile.name}. Pick one option per meal; Indian and Western choices are included.`} right={<VegToggle vegetarian={vegetarian} setVegetarian={setVegetarian} />} />
      <NeedsBar model={model} />
      <div className="meal-grid">
        {plan.map((s) => (
          <Card key={s.slot} className="meal">
            <h4><span aria-hidden="true">{SLOT_ICON[s.slot]}</span> {s.slot}{s.optional && <span className="muted small"> · optional</span>}</h4>
            <ul className="plain">
              {s.options.map((o) => (
                <li key={o.text}>
                  <div>{o.text}</div>
                  <div className="meal-meta"><span className="tag">{o.cuisine === 'Any' ? 'Indian or Western' : o.cuisine}</span>{o.helps.map((h) => <span key={h} className="tag soft">{h}</span>)}</div>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
      <Card>
        <h3>Your plate at lunch and dinner</h3>
        <Plate plate={model.foodRecommendations.plate} />
        <ul className="plate-notes">{model.foodRecommendations.plate.notes.map((n) => <li key={n}>{n}</li>)}</ul>
      </Card>
      <p className="muted small">These are everyday food ideas, not a prescribed diet. No extreme calorie restriction. If you take medicines for blood sugar, ask your clinician before big changes to meals.</p>
    </div>
  );
}
