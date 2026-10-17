import { Card, SectionTitle } from './ui.jsx';
import { NEED_LABEL } from '../content/foods.js';
import FoodPreferences, { VegMark } from './FoodPreferences.jsx';

const TREND_LABEL = { improving: 'improving', back_in_range: 'back in range', worsening: 'getting worse', new_out: 'newly out of range', unchanged: 'unchanged' };

export function NeedsBar({ model }) {
  const { weights: w, trends = {} } = model.foodRecommendations.needs;
  const items = Object.entries(w).sort((a, b) => b[1] - a[1]);
  if (!items.length) return <p className="muted">No results call for specific food changes, so these are general healthy picks.</p>;
  return (
    <div className="needs">
      <span className="muted small">Personalized for {model.profile.name}'s results:</span>
      {items.map(([n, v]) => (
        <span key={n} className={`pill sev-${v >= 3 ? 'priority' : v === 2 ? 'attention' : 'watch'}`}>
          {NEED_LABEL[n]}{trends[n] && <span className={`trend-note ${trends[n]}`}> · {TREND_LABEL[trends[n]]}</span>}
        </span>
      ))}
    </div>
  );
}

export function FoodFacts({ food }) {
  if (!food.facts?.length && !food.watch?.length) return null;
  return (
    <div className="facts">
      <span className="muted tiny">Per {food.serving}:</span>
      {food.facts.map((f) => <span key={f} className="fact good">{f}</span>)}
      {food.watch.map((f) => <span key={f} className="fact watch">{f}</span>)}
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

export default function Nutrition({ model, prefs, setPrefs }) {
  const fr = model.foodRecommendations;
  return (
    <div className="stack">
      <SectionTitle icon="🥗" title={`Food & Nutrition for ${model.profile.name}`} sub="Ranked from this profile's lab results using USDA nutrient values per serving. Medicines are not in the records, so check big changes with a clinician." />
      <FoodPreferences prefs={prefs} setPrefs={setPrefs} name={model.profile.name} />
      <NeedsBar model={model} />

      <h3 className="h3">✅ Foods to Eat More Often</h3>
      {!fr.eatMore.length && <p className="muted">No foods in the library match all of the selected preferences. Try removing an item under Avoid.</p>}
      <div className="grid-cards">
        {fr.eatMore.map((s) => (
          <Card key={s.name}>
            <h4><span aria-hidden="true">{s.icon}</span> {s.name}</h4>
            <ul className="plain">
              {s.items.map((f) => (
                <li key={f.id}>
                  <strong><VegMark diet={f.diet} /> {f.name}</strong>
                  <div className="small">{s.general ? 'A generally healthy choice; not tied to a specific result for this profile.' : f.reason}</div>
                  <FoodFacts food={f} />
                  {f.ideasText && <div className="muted small">Ideas: {f.ideasText}</div>}
                </li>
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
              <tr key={l.id}><td data-label="Limit"><strong>{l.food}</strong>{l.exampleText && <div className="muted small">{l.exampleText}</div>}</td><td data-label="Why">{l.why}</td><td data-label="Affects" className="small">{l.labs.join(' · ')}</td><td data-label="Instead">{l.instead}</td></tr>
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

      {fr.habits.length > 0 && (
        <>
          <h3 className="h3">🚶 Daily Habits</h3>
          <Card><ul className="plain">{fr.habits.map((h) => <li key={h.text}>{h.text}</li>)}</ul></Card>
        </>
      )}

      <h3 className="h3">🍽️ Personalized Meal Plate</h3>
      <Card>
        <Plate plate={fr.plate} />
        {fr.plate.notes.length > 0 && <ul className="plate-notes">{fr.plate.notes.map((n) => <li key={n}>{n}</li>)}</ul>}
      </Card>
      <p className="muted tiny">Nutrient values: USDA National Nutrient Database for Standard Reference, Release 28 (public domain). % DV uses FDA Daily Values for adults.</p>
    </div>
  );
}
