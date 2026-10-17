import { MARKER_BY_ID } from '../lib/normalize.js';
import { Modal, StatusPill, RangeBar, TrendText, valueText, fmtDate } from './ui.jsx';
import TrendChart from './TrendChart.jsx';

const ok = (t) => t && t !== '—';

export default function LabDetail({ rec, model, onClose }) {
  const m = MARKER_BY_ID[rec.marker_id];
  const finding = model.healthInsights.findings.find((f) => f.evidence.some((e) => e.marker_id === rec.marker_id));
  return (
    <Modal title={`${rec.full_name} · ${model.profile.name}`} onClose={onClose} wide>
      <div className="detail-top">
        <div>
          <div className="muted small">Current result</div>
          <div className="detail-val">{valueText(rec)} <span className="muted">{typeof rec.value === 'number' ? rec.unit : ''}</span></div>
          <StatusPill rec={rec} />
        </div>
        <div>
          <div className="muted small">Reference range (from the lab)</div>
          <div className="detail-range">{rec.range_text} {rec.reference_rule ? rec.unit : ''}</div>
          <RangeBar rec={rec} width={180} />
        </div>
        <div>
          <div className="muted small">Collected</div>
          <div>{fmtDate(rec.collection_date)}</div>
          <div className="muted small" style={{ marginTop: 6 }}>Previous</div>
          <div>{rec.previous_value ?? 'Not available'} · <TrendText rec={rec} /></div>
        </div>
      </div>
      <p className="interp-box">{rec.interpretation}</p>

      {rec.history.length > 1
        ? <TrendChart rec={rec} />
        : <p className="muted small">Baseline measurement — additional results are needed to establish a trend.</p>}

      <div className="detail-grid">
        <section><h4>What the test is</h4><p>{m?.what || 'No description available for this test.'}</p></section>
        <section><h4>Why it is measured</h4><p>{m?.why || 'Ask your clinician why this test was ordered.'}</p></section>
        <section><h4>What high results may mean</h4><p>{m?.high || '—'}</p></section>
        <section><h4>What low results may mean</h4><p>{m?.low || '—'}</p></section>
        {ok(m?.nutrition) && <section><h4>Nutrition factors</h4><p>{m.nutrition}</p></section>}
        {ok(m?.lifestyle) && <section><h4>Lifestyle factors</h4><p>{m.lifestyle}</p></section>}
        {m?.followUp?.length > 0 && <section><h4>Possible follow-up tests</h4><ul>{m.followUp.map((t) => <li key={t}>{t}</li>)}</ul><p className="muted small">To discuss with a healthcare professional; not a medical order.</p></section>}
        <section><h4>Questions to ask a healthcare professional</h4><ul>{(m?.questions?.length ? m.questions : [`What does my ${rec.test_name} result mean for me?`]).map((q) => <li key={q}>{q}</li>)}</ul></section>
      </div>
      {m?.caution && <p className="note">{m.caution}</p>}
      {finding && <p className="note"><strong>Related finding:</strong> {finding.title}. See “What Needs Attention”.</p>}
      <div className="provenance small muted">
        Source: {rec.source || 'Unknown'} · {rec.laboratory_name || 'Unknown lab'}{rec.report ? ` · ${rec.report}` : ''}
        {rec.original_name !== rec.test_name && <> · Reported as “{rec.original_name}”</>}
        {rec.notes && <div>Lab notes: {rec.notes}</div>}
      </div>
    </Modal>
  );
}
