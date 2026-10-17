import { SectionTitle } from './ui.jsx';
import { NeedsBar, FoodFacts } from './Nutrition.jsx';
import FoodPreferences, { VegMark } from './FoodPreferences.jsx';

export default function TopFoods({ model, prefs, setPrefs }) {
  const foods = model.foodRecommendations.top10;
  const general = !Object.keys(model.foodRecommendations.needs.weights).length;
  const hide = (id) => setPrefs({ ...prefs, hidden: [...prefs.hidden, id] });
  return (
    <div className="stack">
      <SectionTitle icon="⭐" title={`Top 10 Foods for ${model.profile.name}`} sub="Ranked by how much each serving helps this profile's flagged results, from USDA nutrient values. Hide anything you don't eat and the next best food takes its place." />
      <FoodPreferences prefs={prefs} setPrefs={setPrefs} name={model.profile.name} />
      <NeedsBar model={model} />
      {!foods.length && <p className="muted">No foods in the library match all of the selected preferences. Try removing an item under Avoid.</p>}
      <div className="table-wrap">
        <table className="table foods">
          <thead><tr><th>#</th><th>Food</th><th>Why it is recommended</th><th>Supports</th><th>Serving</th><th>Frequency</th><th><span className="sr-only">Hide</span></th></tr></thead>
          <tbody>
            {foods.map((f, i) => (
              <tr key={f.id}>
                <td data-label="#" className="num rank">{i + 1}</td>
                <td data-label="Food"><span className="food-emoji" aria-hidden="true">{f.emoji}</span> <VegMark diet={f.diet} /> <strong>{f.name}</strong>{f.ideasText && <div className="muted small">{f.ideasText}</div>}</td>
                <td data-label="Why">{general ? 'A generally healthy choice for blood sugar and cholesterol.' : f.reason}<FoodFacts food={f} />{f.note && <div className="muted small">{f.note}</div>}</td>
                <td data-label="Supports" className="small"><div className="supports">{(f.supportsLabs.length ? f.supportsLabs : f.supportsAreas).map((l) => <span key={l} className="chip">{l}</span>)}</div></td>
                <td data-label="Serving">{f.serving}</td>
                <td data-label="Frequency">{f.frequency}</td>
                <td data-label=""><button type="button" className="btn-link small" onClick={() => hide(f.id)} aria-label={`Hide ${f.name}`}>Hide</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="muted tiny">Nutrient values: USDA National Nutrient Database for Standard Reference, Release 28 (public domain). % DV uses FDA Daily Values for adults.</p>
    </div>
  );
}
