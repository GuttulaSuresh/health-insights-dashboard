import { Card } from './ui.jsx';
import { shortDate } from '../lib/progress.js';

const ICON = { improving: '↘', back_in_range: '✓', worsening: '↗', new_out: '!', unchanged: '→' };
const TITLE = { improving: 'Improving', back_in_range: 'Back in range', worsening: 'Getting worse', new_out: 'Newly out of range', unchanged: 'No real change' };

/** "Since your last report": what moved between the two most recent results for each test. */
export default function Progress({ model, open, limit }) {
  const items = limit ? model.progress.slice(0, limit) : model.progress;
  if (!model.progress.length) return null;
  const since = model.progress.map((p) => p.since).sort().pop();
  return (
    <Card>
      <h3>Since the last report</h3>
      <p className="muted small">Compared with each test&apos;s previous result{since ? ` (most recently ${shortDate(since)})` : ''}.</p>
      <div className="progress-list">
        {items.map((p) => (
          <div key={p.marker_id} className={`progress-item ${p.kind}`}>
            <span className="icon" aria-hidden="true">{p.kind === 'improving' || p.kind === 'worsening' ? (p.to < p.from ? '↓' : '↑') : ICON[p.kind]}</span>
            <div>
              <strong>{TITLE[p.kind]}: </strong>{p.text}
              {p.overall && <div className="muted small">{p.overall}</div>}
              {open && <button type="button" className="btn-link small" onClick={() => open(p.rec)}>View {p.test_name}</button>}
            </div>
          </div>
        ))}
      </div>
      {limit && model.progress.length > limit && <p className="muted small">{model.progress.length - limit} more on the Trends tab.</p>}
    </Card>
  );
}
