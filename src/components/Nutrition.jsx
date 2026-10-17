import React from 'react';
import { Card, SectionTitle } from './ui.jsx';
import { eatMore } from '../lib/nutrition.js';
import { NEED_LABEL } from '../content/foods.js';

export function VegToggle({ vegetarian, setVegetarian }) {
  return (
    <label className="toggle">
      <input type="checkbox" checked={vegetarian} onChange={(e) => setVegetarian(e.target.checked)} />
      <span className="track" aria-hidden="true"><span className="thumb" /></span>
      Vegetarian options only
    </label>
  );
}

export function NeedsBar({ model }) {
  const w = model.foodRecommendations.needs.weights;
  const items = Object.entries(w).sort((a, b) => b[1] - a[1]);
  if (!items.length) return <p className="muted">No results call for specific food changes; general healthy eating applies.</p>;
  return (
    <div className="needs">
      <span className="muted small">Personalized for {model.profile.name}'s results:</span>
      {items.map(([n, v]) => <span key={n} className={`pill sev-${v >= 3 ? 'priority' : v === 2 ? 'attention' : 'watch'}`}>{NEED_LABEL[n]}</span>)}
    </div>
  );
}

const PLATE_COLORS = { veg: '#2f9e6b', protein: '#0e7490', carbs: '#d49a2a', fats: '#8a6fc4' };
const PLATE_LABEL = { veg: 'Non-starchy vegetables', protein: 'Protein', carbs: 'High-fiber carbohydrates', fats: 'Healthy fats' };

export function Plate({ plate }) {
  const entries = Object.entries(plate.parts);
  let acc = 0;
  const R = 80, C = 100;
  const arc = (start, end) => {
    const a0 = (start / 100) * 2 * Math.PI - Math.PI / 2, a1 = (end / 100) * 2 * Math.PI - Math.PI / 2;
    const large = end - start > 50 ? 1 : 0;
    return `M ${C} ${C} L ${C + R * Math.cos(a0)} ${C + R * Math.sin(a0)} A ${R} ${R} 0 ${large} 1 ${C + R * Math.cos(a1)} ${C + R * Math.sin(a1)} Z`;
  };
  return (
    <div className="plate">
      <svg viewBox="0 0 200 200" className="plate-svg" role="img" aria-label={entries.map(([k, v]) => `${PLATE_LABEL[k]} ${v}%`).join(', ')}>
        <circle cx={C} cy={C} r={96} className="plate-rim" />
        {entries.map(([k, v]) => { const d = arc(acc, acc + v); acc += v; return <path key={k} d={d} fill={PLATE_COLORS[k]} stroke="#fff" strokeWidth="2" />; })}
        <circle cx={C} cy={C} r={30} fill="#fff" />
        <text x={C} y={C + 5} textAnchor="middle" className="plate-center">Plate</text>
      </svg>
      <div className="plate-legend">
        {entries.map(([k, v]) => (
          <div key={k} className="plate-item">
            <span className="swatch" style={{ background: PLATE_COLORS[k] }} />
            <div><strong>{PLATE_LABEL[k]} · {v}%</strong><div className="muted small">{plate.examples[k].join(' · ')}</div></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Nutrition({ model, vegetarian, setVegetarian }) {
  const fr = model.foodRecommendations;
  const sections = React.useMemo(() => eatMore(fr.needs, { vegetarian }), [fr.needs, vegetarian]);
  return (
    <div className="stack">
      <SectionTitle icon="🥗" title={`Food & Nutrition for ${model.profile.name}`} sub="Generated from this profile's lab results. Diet preferences, allergies and medicines are not in the records, so skip anything that does not suit you." right={<VegToggle vegetarian={vegetarian} setVegetarian={setVegetarian} />} />
      <NeedsBar model={model} />

      <h3 className="h3">✅ Foods to Eat More Often</h3>
      <div className="grid-cards">
        {sections.map((s) => (
          <Card key={s.name}>
            <h4><span aria-hidden="true">{s.icon}</span> {s.name}</h4>
            <ul className="plain">
              {s.items.map((f) => (
                <li key={f.id}><strong>{f.name}</strong><div className="small">{f.reason}</div>{f.supportsLabs.length > 0 && <div className="muted small">Supports: {f.supportsLabs.join(' · ')}</div>}</li>
              ))}
            </ul>
          </Card>
        ))}
      </div>

      <h3 className="h3">⚠️ Foods to Limit</h3>
      {fr.limit.length ? (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Limit</th><th>Why it may be better to limit</th><th>Lab result it affects</th><th>Healthier replacement</th></tr></thead>
            <tbody>{fr.limit.map((l) => (
              <tr key={l.id}><td data-label="Limit"><strong>{l.food}</strong></td><td data-label="Why">{l.why}</td><td data-label="Affects" className="small">{l.labs.join(' · ')}</td><td data-label="Instead">{l.instead}</td></tr>
            ))}</tbody>
          </table>
        </div>
      ) : <p className="muted">Nothing needs limiting based on the current results.</p>}
      <p className="muted small">Limit, not ban. Nothing here needs to be cut out completely.</p>

      {fr.swaps.length > 0 && (
        <>
          <h3 className="h3">🔄 Better Swaps</h3>
          <div className="swap-grid">
            {fr.swaps.map((s) => (
              <Card key={s.from} className="swap"><div className="muted small">Instead of</div><div className="swap-from">{s.from}</div><div className="muted small">Choose</div><div className="swap-to">{s.to}</div></Card>
            ))}
          </div>
        </>
      )}

      <h3 className="h3">🍽️ Personalized Meal Plate</h3>
      <Card>
        <Plate plate={fr.plate} />
        {fr.plate.notes.length > 0 && <ul className="plate-notes">{fr.plate.notes.map((n) => <li key={n}>{n}</li>)}</ul>}
      </Card>
    </div>
  );
}
