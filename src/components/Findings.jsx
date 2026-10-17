import { Card, SevPill, SectionTitle } from './ui.jsx';

export default function Findings({ model, open }) {
  const { findings } = model.healthInsights;
  return (
    <div className="stack">
      <SectionTitle icon="🔎" title="What Needs Attention" sub={`Abnormal and borderline results for ${model.profile.name}, grouped by related labs and ranked by importance. These are not diagnoses.`} />
      <div className="legend">
        <SevPill sev="watch">Mildly abnormal</SevPill><SevPill sev="attention">Moderately concerning</SevPill><SevPill sev="priority">Important to discuss soon</SevPill>
      </div>
      {!findings.length && <Card><p>All of {model.profile.name}'s reported results are within the lab ranges. Nothing needs attention right now.</p></Card>}
      {findings.map((f, i) => (
        <Card key={f.id} className={`finding sev-border-${f.severity}`}>
          <div className="finding-head">
            <h3><span className="num-badge">{i + 1}</span>{f.title}</h3>
            <div className="chip-row"><SevPill sev={f.severity}>{f.level}</SevPill><span className="pill sev-na">Confidence: {f.confidence}</span></div>
          </div>
          <div className="chip-row">
            {f.evidence.map((r) => <button key={r.marker_id} className="chip strong" onClick={() => open(r)}>{r.test_name} {r.value} {r.unit}</button>)}
            {f.relatedRecords.filter((r) => !f.evidence.includes(r)).map((r) => <button key={r.marker_id} className="chip" onClick={() => open(r)}>{r.test_name} {r.value} {r.unit}</button>)}
          </div>
          <dl className="finding-dl">
            <dt>1. What the test measures</dt><dd>{f.measures}</dd>
            <dt>2. What the current value means</dt><dd>{f.meaning}</dd>
            <dt>3. Why it may matter</dt><dd>{f.whyMatters}</dd>
            <dt>4. How concerning</dt><dd><strong>{f.level}.</strong> {f.severity === 'priority' ? 'Consider discussing this with a healthcare professional soon.' : f.severity === 'attention' ? 'Worth discussing at your next appointment.' : 'Usually worth keeping an eye on.'}</dd>
            <dt>5. Lifestyle and nutrition that may help</dt>
            <dd>{f.nutrition.length + f.lifestyle.length ? <ul>{[...f.nutrition, ...f.lifestyle].map((x) => <li key={x}>{x}</li>)}</ul> : 'No specific changes needed for this result.'}</dd>
            <dt>6. Follow-up to discuss</dt>
            <dd>{f.followUp.length ? <><ul>{f.followUp.map((x) => <li key={x}>{x}</li>)}</ul><span className="muted small">Questions or tests to discuss with a healthcare professional.</span></> : 'Only if your clinician raises it.'}</dd>
          </dl>
        </Card>
      ))}
    </div>
  );
}
