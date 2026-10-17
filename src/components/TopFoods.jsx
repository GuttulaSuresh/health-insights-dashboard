import React from 'react';
import { SectionTitle } from './ui.jsx';
import { topFoods } from '../lib/nutrition.js';
import { VegToggle, NeedsBar } from './Nutrition.jsx';

export default function TopFoods({ model, vegetarian, setVegetarian }) {
  const foods = React.useMemo(() => topFoods(model.foodRecommendations.needs, 10, { vegetarian }), [model, vegetarian]);
  return (
    <div className="stack">
      <SectionTitle icon="⭐" title={`Top 10 Foods for ${model.profile.name}`} sub="Ranked by how many of this profile's flagged results each food supports, and how strongly." right={<VegToggle vegetarian={vegetarian} setVegetarian={setVegetarian} />} />
      <NeedsBar model={model} />
      {!foods.length && <p className="muted">No results call for specific foods. A varied diet with vegetables, legumes, whole grains and fruit is a good default.</p>}
      <div className="table-wrap">
        <table className="table foods">
          <thead><tr><th>#</th><th>Food</th><th>Main benefit</th><th>Supports</th><th>Why it is recommended</th><th>Serving</th><th>Frequency</th></tr></thead>
          <tbody>
            {foods.map((f, i) => (
              <tr key={f.id}>
                <td data-label="#" className="num rank">{i + 1}</td>
                <td data-label="Food"><span className="food-emoji" aria-hidden="true">{f.emoji}</span> <strong>{f.name}</strong><div className="muted small">{f.ideas}</div>{f.vegAlt && <div className="small veg-alt">{f.vegAlt}</div>}</td>
                <td data-label="Benefit">{f.benefit}</td>
                <td data-label="Supports" className="small"><div className="supports">{f.supportsLabs.map((l) => <span key={l} className="chip">{l}</span>)}</div></td>
                <td data-label="Why">{f.reason}{f.note && <div className="muted small">{f.note}</div>}</td>
                <td data-label="Serving">{f.serving}</td>
                <td data-label="Frequency">{f.frequency}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
