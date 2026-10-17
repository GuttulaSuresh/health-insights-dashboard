import { fmtDate } from './ui.jsx';

/** Line chart of real measurements only, with the lab reference range shaded. */
export default function TrendChart({ rec, height = 170 }) {
  const pts = rec.history;
  const W = 520, H = height, P = { l: 44, r: 44, t: 22, b: 30 };
  const vals = pts.map((p) => p.value);
  const lo = rec.reference_low, hi = rec.reference_high;
  const limits = [lo, hi].filter((v) => v !== null && v !== undefined);
  let min = Math.min(...vals, ...limits), max = Math.max(...vals, ...limits);
  const pad = (max - min || Math.abs(max) || 1) * 0.15;
  min = Math.max(0, min - pad); max += pad;
  const t0 = new Date(pts[0].date).getTime(), t1 = new Date(pts[pts.length - 1].date).getTime();
  const x = (d) => P.l + (t1 === t0 ? 0.5 : (new Date(d).getTime() - t0) / (t1 - t0)) * (W - P.l - P.r);
  const y = (v) => P.t + (1 - (v - min) / (max - min)) * (H - P.t - P.b);
  const bandTop = y(hi ?? max), bandBot = y(lo ?? min);
  const ticks = [min, (min + max) / 2];
  return (
    <figure className="trend-chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`${rec.test_name} over time: ${pts.map((p) => `${p.date} ${p.value}`).join(', ')}`}>
        {(lo !== null || hi !== null) && <rect x={P.l} y={bandTop} width={W - P.l - P.r} height={Math.max(0, bandBot - bandTop)} className="tc-band" />}
        {ticks.map((t) => (
          <g key={t}><line x1={P.l} x2={W - P.r} y1={y(t)} y2={y(t)} className="tc-grid" /><text x={P.l - 6} y={y(t) + 4} textAnchor="end" className="tc-axis">{+t.toFixed(t < 10 ? 1 : 0)}</text></g>
        ))}
        <polyline points={pts.map((p) => `${x(p.date)},${y(p.value)}`).join(' ')} className="tc-line" />
        {pts.map((p) => (
          <g key={p.date}>
            <circle cx={x(p.date)} cy={y(p.value)} r="4.5" className={`tc-dot ${p.status === 'IN RANGE' ? 'in' : 'out'}`} />
            <text x={x(p.date)} y={y(p.value) - 9} textAnchor="middle" className="tc-val">{p.value}</text>
            <text x={x(p.date)} y={H - 8} textAnchor="middle" className="tc-axis">{fmtDate(p.date)}</text>
          </g>
        ))}
      </svg>
      <figcaption className="muted small">Shaded band = lab reference range ({rec.range_text}). Only actual measurements are plotted.</figcaption>
    </figure>
  );
}
