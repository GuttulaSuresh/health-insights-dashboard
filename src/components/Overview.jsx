import React from 'react';
import { Card, SevPill, SectionTitle, Modal, fmtDate, StatusPill } from './ui.jsx';
import { PENALTY } from '../lib/insights.js';

function ScoreRing({ value }) {
  const r = 46, c = 2 * Math.PI * r, pct = value === null ? 0 : value / 100;
  return (
    <svg viewBox="0 0 110 110" className="score-ring" aria-hidden="true">
      <circle cx="55" cy="55" r={r} className="ring-bg" />
      <circle cx="55" cy="55" r={r} className="ring-fg" strokeDasharray={`${c * pct} ${c}`} transform="rotate(-90 55 55)" />
      <text x="55" y="61" textAnchor="middle" className="ring-num">{value ?? '—'}</text>
    </svg>
  );
}

function ScoreModal({ score, name, onClose }) {
  return (
    <Modal title={`How ${name}'s Wellness Snapshot Score is calculated`} onClose={onClose} wide>
      <p>This is a simple summary of how many results sit inside the lab's reference ranges. <strong>It is not a medical diagnosis or a risk score.</strong></p>
      <ol className="steps">
        <li>Each area starts at 100.</li>
        <li>The most significant result in the area subtracts: Watch −{PENALTY.watch}, Needs attention −{PENALTY.attention}, High priority −{PENALTY.priority}.</li>
        <li>Other flagged results in the same area subtract only a quarter of their points, so one mildly abnormal result is never penalized heavily.</li>
        <li>Areas with no results are left out instead of being guessed. The overall score is the average of the areas that have data ({score.coverage} of {score.of}).</li>
      </ol>
      <div className="table-wrap">
        <table className="table">
          <thead><tr><th>Area</th><th>Score</th><th>Results counted</th><th>Flagged</th><th>Calculation</th></tr></thead>
          <tbody>
            {score.areas.map((a) => (
              <tr key={a.id}>
                <td><strong>{a.name}</strong></td>
                <td className="num">{a.score ?? <span className="muted">No data</span>}</td>
                <td className="num">{a.recs.length || '—'}</td>
                <td>{a.flagged?.length ? a.flagged.map((r) => <div key={r.marker_id}><StatusPill rec={r} /> {r.test_name} {r.value}</div>) : <span className="muted">None</span>}</td>
                <td className="small">{a.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="score-total">Overall: <strong>{score.total ?? '—'}</strong> / 100 · {score.band}</p>
    </Modal>
  );
}

export default function Overview({ model, go, open }) {
  const { healthInsights: hi, profile } = model;
  const [showScore, setShowScore] = React.useState(false);
  const pri = hi.findings.filter((f) => f.severity === 'priority');
  const overallSev = pri.length ? 'priority' : hi.findings.some((f) => f.severity === 'attention') ? 'attention' : hi.findings.length ? 'watch' : 'ok';
  const focus = [...new Set(hi.findings.filter((f) => !f.lowConcern).map((f) => f.area))].slice(0, 5);

  return (
    <div className="stack">
      <SectionTitle icon="👤" title={`${profile.name}'s Health Overview`} sub="Based only on this profile's uploaded lab reports." />

      <Card className={`summary sev-border-${overallSev}`}>
        <div className="summary-head">
          <h3>Overall Health Summary</h3>
          <SevPill sev={overallSev}>{overallSev === 'priority' ? 'Has a high-priority result' : overallSev === 'attention' ? 'Some results need attention' : overallSev === 'watch' ? 'Mostly in range' : 'All in range'}</SevPill>
        </div>
        <p className="lead">{hi.summary}</p>
      </Card>

      <div className="stat-grid">
        <Card className="stat sev-border-ok"><div className="stat-num ok">{hi.counts.normal}</div><div className="stat-label">Results in normal range</div><div className="muted small">of {hi.counts.total - hi.counts.noData} reported</div></Card>
        <Card className="stat sev-border-attention clickable" onClick={() => go('labs')} role="button" tabIndex={0}><div className="stat-num attention">{hi.counts.attention}</div><div className="stat-label">Results needing attention</div><div className="muted small">{hi.counts.high} high · {hi.counts.low} low · incl. borderline</div></Card>
        <Card className="stat sev-border-priority clickable" onClick={() => go('attention')} role="button" tabIndex={0}><div className="stat-num priority">{hi.counts.priority}</div><div className="stat-label">High-priority results</div><div className="muted small">{hi.counts.priority ? 'Discuss with a clinician soon' : 'None found'}</div></Card>
        <Card className="stat sev-border-na"><div className="stat-num date">{fmtDate(model.latestDate)}</div><div className="stat-label">Latest lab date</div><div className="muted small">{model.dates.length} collection date{model.dates.length === 1 ? '' : 's'} on file</div></Card>
      </div>

      <div className="two-col">
        <Card className="score-card clickable" onClick={() => setShowScore(true)} role="button" tabIndex={0} onKeyDown={(e) => e.key === 'Enter' && setShowScore(true)}>
          <div className="score-wrap">
            <ScoreRing value={hi.score.total} />
            <div>
              <h3>Wellness Snapshot Score</h3>
              <p className="muted small">{hi.score.band} · {hi.score.coverage} of {hi.score.of} areas with data</p>
              <p className="small">Not a diagnosis. A simple summary of how results compare with lab ranges.</p>
              <span className="link">See how it is calculated →</span>
            </div>
          </div>
        </Card>
        <Card>
          <h3>Major Health Focus Areas</h3>
          {focus.length ? (
            <ol className="focus-list">
              {focus.map((a) => {
                const f = hi.findings.find((x) => x.area === a);
                return <li key={a}><SevPill sev={f.severity} /> <strong>{a}</strong><div className="muted small">{f.evidence.map((r) => `${r.test_name} ${r.value}${r.unit ? ' ' + r.unit : ''}`).join(' · ')}</div></li>;
              })}
            </ol>
          ) : <p className="muted">No areas flagged. Keep up current habits.</p>}
          <button className="btn-link" onClick={() => go('goals')}>See health goals →</button>
        </Card>
      </div>

      <SectionTitle title="By body system" sub="Color shows the most significant result in each group. Tap a group to see its results." />
      <div className="cat-grid">
        {hi.categories.map((c) => (
          <Card key={c.id} className={`cat sev-border-${c.severity} clickable`} onClick={() => go('labs')} role="button" tabIndex={0}>
            <div className="cat-head"><span className="cat-ico" aria-hidden="true">{c.icon}</span><strong>{c.name}</strong></div>
            <SevPill sev={c.severity} />
            <div className="muted small">{c.flagged.length ? c.flagged.map((r) => `${r.test_name} ${r.value}`).join(', ') : `${c.recs.length} result${c.recs.length === 1 ? '' : 's'}${c.severity === 'na' ? ' not reported' : ' in range'}`}</div>
          </Card>
        ))}
      </div>

      {hi.findings.length > 0 && (
        <>
          <SectionTitle title="Top findings" right={<button className="btn-link" onClick={() => go('attention')}>All findings →</button>} />
          <div className="finding-mini-grid">
            {hi.findings.slice(0, 3).map((f) => (
              <Card key={f.id} className={`sev-border-${f.severity}`}>
                <SevPill sev={f.severity}>{f.level}</SevPill>
                <h4>{f.title}</h4>
                <div className="chip-row">{f.evidence.map((r) => <button key={r.marker_id} className="chip" onClick={() => open(r)}>{r.test_name} {r.value}</button>)}</div>
              </Card>
            ))}
          </div>
        </>
      )}
      {showScore && <ScoreModal score={hi.score} name={profile.name} onClose={() => setShowScore(false)} />}
    </div>
  );
}
