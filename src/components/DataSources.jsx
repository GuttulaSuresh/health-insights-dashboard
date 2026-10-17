import { Card, SectionTitle, fmtDate } from './ui.jsx';
import { DATA_DIR } from '../lib/config.js';

const fileLabel = (f) => (f.startsWith('upload:') ? `${f.slice(7).replace(/ \(r[a-z0-9]+\)$/, '')} (added in the app)` : `${DATA_DIR}/${f}`);

export default function DataSources({ model, reports = [], go }) {
  const unassigned = reports.filter((r) => r.profile_id === 'unassigned').length;
  return (
    <div className="stack">
      <SectionTitle icon="📚" title="Data sources & quality check" sub={`Everything on this dashboard comes from ${model.profile.name}'s files listed below.`} />
      <div className="two-col">
        <Card>
          <h3>Files loaded for {model.profile.name}</h3>
          <ul>{[...new Set(model.allRecords.map((r) => r.file))].map((f) => <li key={f}><code>{fileLabel(f)}</code></li>)}</ul>
          <p className="small"><strong>{model.sourceCount}</strong> records read · <strong>{model.labRecords.length}</strong> shown · {model.duplicates.length} duplicates merged · {model.quarantined.length} not assigned to {model.profile.name}</p>
          <h4>Sources</h4>
          <ul>{model.sources.map((s) => <li key={s}>{s}</li>)}</ul>
          <h4>Reports</h4>
          <ul>{model.reports.map((s) => <li key={s}>{s}</li>)}</ul>
          {unassigned > 0 && <p className="small">{unassigned} added report{unassigned > 1 ? 's are' : ' is'} still unassigned and not analyzed. {go && <button className="btn-ghost" onClick={() => go('add')}>Assign in Add Report</button>}</p>}
          <p className="small">Collection date{model.dates.length > 1 ? 's' : ''}: {model.dates.map(fmtDate).join(', ') || 'Not available'}</p>
        </Card>
        <Card>
          <h3>Data quality check</h3>
          {model.quality.length ? <ul>{model.quality.map((q, i) => <li key={i}>{q.text}</li>)}</ul> : <p>No missing units, missing dates, unit mismatches or status disagreements were found.</p>}
          {model.quarantined.length > 0 && (
            <>
              <h4>Unassigned health records</h4>
              <p className="small">These records did not belong to {model.profile.name} and were not analyzed:</p>
              <ul>{model.quarantined.map((q, i) => <li key={i}>{q.raw.test_name || 'Unnamed'}: {q.reason}</li>)}</ul>
            </>
          )}
          <h4>How status is decided</h4>
          <p className="small">Each value is compared with the reference range printed by the lab (for example “&lt; 200” or “30–100”). Severity colors add clinical context (for example HbA1c ≥ 6.5% is high priority) but never override the lab range. Missing values show “Not available”; values the lab did not report show “Not reported”. Nothing is estimated.</p>
        </Card>
      </div>
    </div>
  );
}
