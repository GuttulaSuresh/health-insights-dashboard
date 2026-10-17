import React from 'react';

export const SEV_LABEL = { ok: 'Normal', watch: 'Watch', attention: 'Needs attention', priority: 'High priority', na: 'No data' };
export const STATUS_LABEL = { 'IN RANGE': 'Normal', HIGH: 'High', LOW: 'Low', 'NOT REPORTED': 'Not reported', 'NOT AVAILABLE': 'Not available', 'NO RANGE': 'No range', ABNORMAL: 'Abnormal' };

export function SevPill({ sev, children }) {
  return <span className={`pill sev-${sev}`}><span className="dot" aria-hidden="true" />{children || SEV_LABEL[sev]}</span>;
}

/** Result status pill: the word comes from the lab range, the color from severity. */
export function StatusPill({ rec }) {
  const arrow = rec.status === 'HIGH' ? '↑ ' : rec.status === 'LOW' ? '↓ ' : '';
  const text = rec.status === 'IN RANGE' && rec.severity === 'watch' ? 'Borderline' : STATUS_LABEL[rec.status] || rec.status;
  return <span className={`pill sev-${rec.severity}`}>{arrow}{text}</span>;
}

export function Card({ className = '', children, ...rest }) {
  return <div className={`card ${className}`} {...rest}>{children}</div>;
}

export function SectionTitle({ icon, title, sub, right }) {
  return (
    <div className="section-title">
      <div>
        <h2>{icon && <span className="ico" aria-hidden="true">{icon}</span>}{title}</h2>
        {sub && <p className="muted">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

export function valueText(rec) {
  if (rec.status === 'NOT REPORTED') return 'Not reported';
  if (rec.value === null || rec.value === undefined || rec.status === 'NOT AVAILABLE') return 'Not available';
  return String(rec.value);
}

/** Horizontal bar: lab range in green, the person's value as a dot. */
export function RangeBar({ rec, width = 120 }) {
  const v = typeof rec.value === 'number' ? rec.value : null;
  if (v === null || !rec.reference_rule) return <span className="muted small">—</span>;
  let lo = rec.reference_low, hi = rec.reference_high, min, max;
  if (rec.reference_rule === 'lt' || rec.reference_rule === 'le') { min = 0; max = Math.max(hi * 1.6, v * 1.1); lo = 0; }
  else if (rec.reference_rule === 'ge' || rec.reference_rule === 'gt') { min = 0; max = Math.max(lo * 2, v * 1.15); hi = max; }
  else { const span = hi - lo || 1; min = Math.max(0, lo - span * 0.5); max = hi + span * 0.5; if (v < min) min = v * 0.9; if (v > max) max = v * 1.1; }
  const x = (n) => 4 + ((n - min) / (max - min)) * (width - 8);
  return (
    <svg className="rangebar" width={width} height="16" viewBox={`0 0 ${width} 16`} role="img" aria-label={`${rec.test_name} ${v} compared with range ${rec.range_text}`}>
      <rect x="0" y="5" width={width} height="6" rx="3" className="rb-track" />
      <rect x={x(lo)} y="5" width={Math.max(2, x(hi) - x(lo))} height="6" rx="3" className="rb-band" />
      <circle cx={x(v)} cy="8" r="5" className={`rb-dot sev-${rec.severity}`} />
    </svg>
  );
}

export function TrendText({ rec }) {
  if (rec.trend === 'New' || !rec.trend) return <span className="muted">New</span>;
  return <span className={`trend q-${rec.quality}`}>{rec.trend}</span>;
}

export function Collapsible({ title, right, defaultOpen = true, children, id }) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div className={`collapsible ${open ? 'open' : ''}`}>
      <button className="collapsible-head" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>
        <span className="chev" aria-hidden="true">▸</span>
        <span className="ch-title">{title}</span>
        <span className="ch-right">{right}</span>
      </button>
      {open && <div id={id} className="collapsible-body">{children}</div>}
    </div>
  );
}

export function Modal({ title, onClose, children, wide }) {
  React.useEffect(() => {
    const k = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', k);
    document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('keydown', k); document.body.style.overflow = ''; };
  }, [onClose]);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className={`modal ${wide ? 'wide' : ''}`} role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h3>{title}</h3>
          <button className="icon-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>
        <div className="modal-body">{children}</div>
      </div>
    </div>
  );
}

/** Minimal **bold** support for generated text. */
export function Rich({ text }) {
  const parts = String(text).split(/(\*\*[^*]+\*\*)/g);
  return <>{parts.map((p, i) => (p.startsWith('**') ? <strong key={i}>{p.slice(2, -2)}</strong> : <React.Fragment key={i}>{p}</React.Fragment>))}</>;
}

export const DISCLAIMER = 'Health insights are educational and are not a diagnosis or substitute for medical care. Discuss abnormal results, symptoms, medications, supplements, and treatment decisions with a qualified healthcare professional.';

export function fmtDate(d) {
  if (!d) return 'Not available';
  const dt = new Date(`${d}T00:00:00`);
  return isNaN(dt) ? d : dt.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}
