import React from 'react';
import { Card, SectionTitle, SevPill } from './ui.jsx';

export default function Goals({ model, open }) {
  const goals = model.healthGoals;
  const tests = model.healthInsights.followUpTests;
  const qs = model.healthInsights.questions;
  return (
    <div className="stack">
      <SectionTitle icon="🎯" title={`${model.profile.name}'s Health Focus Areas`} sub="Priorities generated from this profile's lab results, most important first." />
      {goals.map((g, i) => (
        <Card key={g.key} className={`goal sev-border-${g.severity}`}>
          <div className="goal-head">
            <div className="muted small">Priority {i + 1}</div>
            <h3>{g.title}</h3>
            {g.severity !== 'ok' && <SevPill sev={g.severity} />}
          </div>
          <div className="goal-body">
            <div>
              <h4>Why</h4>
              <ul>{g.why.map((w) => <li key={w.title}><strong>{w.title}.</strong> {w.text}</li>)}</ul>
              <div className="chip-row">{g.why.flatMap((w) => w.evidence).map((r) => <button key={r.marker_id} className="chip" onClick={() => open(r)}>{r.test_name} {r.value} {r.unit}</button>)}</div>
            </div>
            <div>
              <h4>Actions</h4>
              <dl className="actions">
                {Object.entries(g.actions).filter(([, v]) => v.length).map(([k, v]) => (
                  <React.Fragment key={k}><dt>{k}</dt><dd><ul>{v.map((x) => <li key={x}>{x}</li>)}</ul></dd></React.Fragment>
                ))}
              </dl>
            </div>
          </div>
        </Card>
      ))}

      <SectionTitle icon="🩺" title="Tests to Discuss at Your Next Appointment" sub="Questions or tests to discuss with a healthcare professional. These are not medical orders." />
      {tests.length ? (
        <div className="table-wrap">
          <table className="table">
            <thead><tr><th>Test or follow-up</th><th>Why it may be reasonable</th></tr></thead>
            <tbody>{tests.map((t) => <tr key={t.test}><td data-label="Test"><SevPill sev={t.severity}> </SevPill> <strong>{t.test}</strong></td><td data-label="Why">Linked to: {t.reasons.join('; ')}</td></tr>)}</tbody>
          </table>
        </div>
      ) : <p className="muted">No follow-up tests are suggested by the current results.</p>}

      {qs.length > 0 && (
        <Card>
          <h3>❓ Questions for your next appointment</h3>
          <ol>{qs.map((q) => <li key={q}>{q}</li>)}</ol>
        </Card>
      )}
    </div>
  );
}
