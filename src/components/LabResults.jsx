import React from 'react';
import { CATEGORIES } from '../content/markers.js';
import { Collapsible, SectionTitle, StatusPill, RangeBar, TrendText, valueText, fmtDate, SevPill } from './ui.jsx';

const FILTERS = [
  { id: 'all', label: 'All', test: () => true },
  { id: 'normal', label: 'Normal', test: (r) => r.status === 'IN RANGE' && r.severity === 'ok' },
  { id: 'high', label: 'High', test: (r) => r.status === 'HIGH' },
  { id: 'low', label: 'Low', test: (r) => r.status === 'LOW' },
  { id: 'attention', label: 'Needs Attention', test: (r) => ['watch', 'attention', 'priority'].includes(r.severity) },
];

export default function LabResults({ model, open }) {
  const [filter, setFilter] = React.useState('all');
  const [q, setQ] = React.useState('');
  const [openAll, setOpenAll] = React.useState(0); // bump to remount collapsibles
  const [allOpen, setAllOpen] = React.useState(true);
  const f = FILTERS.find((x) => x.id === filter);
  const recs = model.labRecords.filter(f.test).filter((r) => !q || `${r.test_name} ${r.full_name} ${r.original_name}`.toLowerCase().includes(q.toLowerCase()));
  const counts = Object.fromEntries(FILTERS.map((x) => [x.id, model.labRecords.filter(x.test).length]));

  return (
    <div className="stack">
      <SectionTitle icon="📊" title={`${model.profile.name}'s Lab Results`} sub="Status is calculated by comparing each value to the laboratory's own reference range. Tap any result for a plain-language explanation." />
      <div className="toolbar">
        <div className="filters" role="group" aria-label="Filter results">
          {FILTERS.map((x) => (
            <button key={x.id} className={`filter ${filter === x.id ? 'active' : ''}`} aria-pressed={filter === x.id} onClick={() => setFilter(x.id)}>
              {x.label} <span className="count">{counts[x.id]}</span>
            </button>
          ))}
        </div>
        <div className="toolbar-right">
          <input className="search" type="search" placeholder="Search tests" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search tests" />
          <button className="btn-ghost" onClick={() => { setAllOpen(!allOpen); setOpenAll((n) => n + 1); }}>{allOpen ? 'Collapse all' : 'Expand all'}</button>
        </div>
      </div>

      {CATEGORIES.map((c) => {
        const rows = recs.filter((r) => r.category === c.id);
        if (!rows.length) return null;
        const flagged = rows.filter((r) => ['watch', 'attention', 'priority'].includes(r.severity)).length;
        return (
          <Collapsible key={`${c.id}-${openAll}`} id={`cat-${c.id}`} defaultOpen={allOpen}
            title={<><span aria-hidden="true">{c.icon}</span> {c.name}</>}
            right={<><span className="muted small">{rows.length} test{rows.length === 1 ? '' : 's'}</span>{flagged > 0 && <SevPill sev="attention">{flagged} flagged</SevPill>}</>}>
            <div className="table-wrap">
              <table className="table labs">
                <thead>
                  <tr><th>Test</th><th>Current</th><th>Reference range</th><th>Status</th><th className="hide-sm">Where it sits</th><th>Date</th><th>Previous</th><th>Trend</th><th>Interpretation</th></tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.uid} className={`row sev-row-${r.severity}`} onClick={() => open(r)} tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && open(r)}>
                      <td data-label="Test"><button className="test-link">{r.test_name}</button>{r.full_name !== r.test_name && <div className="muted small">{r.full_name}</div>}</td>
                      <td data-label="Current" className="num"><strong className="big-val">{valueText(r)}</strong> <span className="muted">{typeof r.value === 'number' ? r.unit : ''}</span></td>
                      <td data-label="Range" className="num">{r.range_text}{r.reference_rule && r.unit ? <span className="muted"> {r.unit}</span> : ''}</td>
                      <td data-label="Status"><StatusPill rec={r} /></td>
                      <td data-label="Position" className="hide-sm"><RangeBar rec={r} /></td>
                      <td data-label="Date" className="num">{fmtDate(r.collection_date)}</td>
                      <td data-label="Previous" className={`num ${r.previous_value == null ? 'hide-sm-new' : ''}`}>{r.previous_value ?? <span className="muted">Not available</span>}</td>
                      <td data-label="Trend" className={r.trend === 'New' ? 'hide-sm-new' : ''}><TrendText rec={r} /></td>
                      <td data-label="Meaning" className="interp">{r.interpretation}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Collapsible>
        );
      })}
      {!recs.length && <p className="muted">No results match this filter.</p>}
    </div>
  );
}
