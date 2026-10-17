import React from 'react';
import { Card, SectionTitle, Rich, StatusPill } from './ui.jsx';
import { answer, SAMPLE_QUESTIONS } from '../lib/qa.js';
import { askLocalModel } from '../lib/localAi.js';
import LocalAiPanel, { useLocalAi } from './LocalAi.jsx';

export default function Ask({ model, open }) {
  const [q, setQ] = React.useState('');
  const [log, setLog] = React.useState([]); // this component remounts per profile, so history is per profile
  const endRef = React.useRef(null);
  const ai = useLocalAi();
  const useAi = ai.status === 'ready' && ai.enabled;

  const ask = (question) => {
    const text = question.trim();
    if (!text) return;
    const id = Date.now();
    setLog((l) => [...l, { id, q: text, a: answer(text, model), ai: useAi ? { text: '', done: false } : null }]);
    setQ('');
    if (!useAi) return;
    const update = (patch) => setLog((l) => l.map((m) => (m.id === id ? { ...m, ai: { ...m.ai, ...patch } } : m)));
    askLocalModel(ai.engine, model, text, (t) => update({ text: t }))
      .then(() => update({ done: true }))
      .catch((e) => update({ done: true, error: e?.message || String(e) }));
  };
  React.useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, [log]);

  return (
    <div className="stack">
      <SectionTitle icon="💬" title="Ask About My Results" sub={`Answers use only ${model.profile.name}'s results and food preferences. Works offline with a rule-based engine; no data leaves this device.`} />
      <Card className="ask">
        <div className="sample-qs">{SAMPLE_QUESTIONS.map((s) => <button key={s} className="chip" onClick={() => ask(s)}>{s}</button>)}</div>
        <div className="conversation" aria-live="polite">
          {!log.length && <p className="muted">Pick a question above or type your own.</p>}
          {log.map((m) => (
            <div key={m.id} className="qa">
              <div className="bubble user">{m.q}</div>
              <div className="bubble bot">
                {m.a.blocks.map((b, j) => b.type === 'p' ? <p key={j}><Rich text={b.text} /></p> : <ul key={j}>{b.items.map((it) => <li key={it}><Rich text={it} /></li>)}</ul>)}
                {m.a.refs.length > 0 && (
                  <div className="refs"><span className="muted small">Based on:</span>{m.a.refs.map((r) => <button key={r.marker_id} className="chip" onClick={() => open(r)}><StatusPill rec={r} /> {r.test_name} {r.value}</button>)}</div>
                )}
                <p className="muted tiny">Educational only, not a diagnosis.</p>
              </div>
              {m.ai && (
                <div className="bubble bot ai">
                  <p className="muted tiny">On-device AI answer. It can be wrong; check it against the answer above.</p>
                  {m.ai.text ? m.ai.text.split(/\n{2,}/).map((para, j) => <p key={j} style={{ whiteSpace: 'pre-wrap' }}><Rich text={para} /></p>) : !m.ai.error && <p className="muted small">Thinking…</p>}
                  {m.ai.error && <p className="small error-text">The on-device AI could not answer: {m.ai.error}</p>}
                </div>
              )}
            </div>
          ))}
          <div ref={endRef} />
        </div>
        <form className="ask-form" onSubmit={(e) => { e.preventDefault(); ask(q); }}>
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Ask about ${model.profile.name}'s results…`} aria-label="Your question" />
          <button className="btn" type="submit">Ask</button>
        </form>
      </Card>
      <LocalAiPanel />
    </div>
  );
}
