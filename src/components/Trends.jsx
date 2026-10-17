import { DATA_DIR } from '../lib/config.js';
import { Card, SectionTitle, StatusPill, TrendText, fmtDate } from './ui.jsx';
import TrendChart from './TrendChart.jsx';

const KEY = ['hba1c', 'fasting_glucose', 'ldl', 'hdl', 'triglycerides', 'non_hdl', 'total_cholesterol', 'vitamin_d', 'vitamin_b12', 'hemoglobin', 'mcv', 'mch', 'iron', 'ferritin', 'iron_saturation'];

export default function Trends({ model, open }) {
  const recs = model.labRecords;
  const byId = Object.fromEntries(recs.map((r) => [r.marker_id, r]));
  const flagged = recs.filter((r) => ['watch', 'attention', 'priority'].includes(r.severity)).map((r) => r.marker_id);
  const keyIds = [...new Set([...KEY.filter((k) => byId[k]), ...flagged])];
  const rest = recs.filter((r) => !keyIds.includes(r.marker_id) && typeof r.value === 'number');
  const multi = recs.filter((r) => r.history.length > 1).length;

  return (
    <div className="stack">
      <SectionTitle icon="📈" title={`${model.profile.name}'s Trends`} sub={multi ? `${multi} tests have more than one measurement.` : `All results come from ${model.dates.length === 1 ? `one collection date (${fmtDate(model.latestDate)})` : 'single measurements'}.`} />
      {!multi && (
        <Card className="note-card">
          <strong>Baseline measurement — additional results are needed to establish a trend.</strong>
          <p className="small">These are {model.profile.name}'s first results on file. Add earlier or later reports in the Add Report tab, or add files under <code>public/{DATA_DIR}/</code> and list them in <code>profiles.json</code>; charts appear here automatically. No historical values are invented.</p>
        </Card>
      )}
      <div className="trend-grid">
        {keyIds.map((id) => {
          const r = byId[id];
          return (
            <Card key={id} className={`trend-card sev-border-${r.severity}`}>
              <div className="trend-head">
                <button className="test-link" onClick={() => open(r)}><strong>{r.test_name} trend</strong></button>
                <StatusPill rec={r} />
              </div>
              {r.history.length > 1 ? (
                <>
                  <TrendChart rec={r} />
                  <div className="small">Previous {r.previous_value} → current {r.value} {r.unit} · <TrendText rec={r} />{r.quality && r.quality !== 'neutral' && <span className="muted"> ({r.quality})</span>}</div>
                </>
              ) : (
                <div className="baseline">
                  <div className="baseline-val"><span className="big-val">{r.value ?? 'Not available'}</span> <span className="muted">{r.unit}</span></div>
                  <div className="muted small">{fmtDate(r.collection_date)} · range {r.range_text}</div>
                  <p className="small">Baseline measurement — additional results are needed to establish a trend.</p>
                </div>
              )}
            </Card>
          );
        })}
      </div>
      {rest.length > 0 && (
        <Card>
          <h4>Other results (single measurement)</h4>
          <div className="chip-row">{rest.map((r) => <button key={r.marker_id} className="chip" onClick={() => open(r)}>{r.test_name} {r.value} · <TrendText rec={r} /></button>)}</div>
        </Card>
      )}
    </div>
  );
}
