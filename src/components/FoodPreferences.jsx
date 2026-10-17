import { DIETS, CUISINES, ALLERGENS, isVegetarianDiet } from '../lib/preferences.js';
import { FOOD_BY_ID } from '../content/foodCatalog.js';

/** Green square with a dot for vegetarian, brown for non-vegetarian, as on Indian food packaging. */
export function VegMark({ diet }) {
  const veg = diet === 'vegan' || diet === 'vegetarian';
  const label = diet === 'vegan' ? 'Vegan' : veg ? 'Vegetarian' : diet === 'egg' ? 'Contains egg' : diet === 'fish' ? 'Contains fish or seafood' : 'Contains meat';
  return <span className={`vegmark ${veg ? 'veg' : 'nonveg'}`} title={label} role="img" aria-label={label}><span /></span>;
}

function Segmented({ label, options, value, onChange }) {
  return (
    <div className="pref-row">
      <span className="pref-label">{label}</span>
      <div className="segmented" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button key={o.id} type="button" role="radio" aria-checked={value === o.id} className={value === o.id ? 'on' : ''} onClick={() => onChange(o.id)}>{o.label}</button>
        ))}
      </div>
    </div>
  );
}

/**
 * Food preferences for the current profile. The vegetarian switch is the most prominent control; diet, cuisine,
 * allergies and hidden foods sit under it. Every change re-ranks foods and meals immediately.
 */
export default function FoodPreferences({ prefs, setPrefs, name }) {
  const veg = isVegetarianDiet(prefs.diet);
  const update = (patch) => setPrefs({ ...prefs, ...patch });
  const toggleVeg = () => update({ diet: veg ? 'all' : 'vegetarian' });
  const toggleAllergen = (id) => update({ avoid: prefs.avoid.includes(id) ? prefs.avoid.filter((a) => a !== id) : [...prefs.avoid, id] });
  const hidden = prefs.hidden.map((id) => FOOD_BY_ID[id]?.name).filter(Boolean);

  return (
    <section className={`card prefs ${veg ? 'is-veg' : ''}`} aria-label="Food preferences">
      <div className="prefs-head">
        <div>
          <h3>Food preferences for {name}</h3>
          <p className="muted small">Saved for this profile on this device. Suggestions and the meal plan update as you change them.</p>
        </div>
        <button type="button" className={`veg-switch ${veg ? 'on' : ''}`} aria-pressed={veg} onClick={toggleVeg}>
          <VegMark diet="vegetarian" />
          <span className="veg-switch-text">
            <strong>Vegetarian options only</strong>
            <span className="small">{veg ? 'On: no meat, fish or eggs' : 'Off: tap to hide meat, fish and eggs'}</span>
          </span>
          <span className="track" aria-hidden="true"><span className="thumb" /></span>
        </button>
      </div>
      {veg && <div className="veg-banner" role="status"><VegMark diet="vegetarian" /> Showing {prefs.diet === 'vegan' ? 'vegan' : 'vegetarian'} foods and meals only.</div>}
      <Segmented label="Diet" options={DIETS} value={prefs.diet} onChange={(diet) => update({ diet })} />
      <Segmented label="Cuisine" options={CUISINES} value={prefs.cuisine} onChange={(cuisine) => update({ cuisine })} />
      <div className="pref-row">
        <span className="pref-label">Avoid</span>
        <div className="chips" role="group" aria-label="Allergies and foods to avoid">
          {ALLERGENS.map((a) => (
            <button key={a.id} type="button" aria-pressed={prefs.avoid.includes(a.id)} className={`chip toggle-chip ${prefs.avoid.includes(a.id) ? 'on' : ''}`} onClick={() => toggleAllergen(a.id)}>{a.label}</button>
          ))}
        </div>
      </div>
      {hidden.length > 0 && (
        <p className="small muted">
          Hidden: {hidden.join(', ')}. <button type="button" className="btn-link" onClick={() => update({ hidden: [] })}>Show them again</button>
        </p>
      )}
    </section>
  );
}
