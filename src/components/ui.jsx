import { FACTOR_META } from '../lib/predict.js'
import { riskTier, cx } from '../lib/util.js'
import { Link } from 'react-router-dom'

const SEG_COLORS = { f1: '#0a9bbf', f2: '#3d84d6', f3: '#d98420', f4: '#6c86a3' }

export function Eyebrow({ children, plain }) {
  return <span className={cx('eyebrow', plain && 'plain')}>{children}</span>
}

export function SectionHead({ eyebrow, title, sub, right }) {
  return (
    <div className="between sec-head">
      <div>
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h2 className="section-title">{title}</h2>
        {sub && <p className="lead" style={{ marginBottom: 0 }}>{sub}</p>}
      </div>
      {right}
    </div>
  )
}

export function RiskBadge({ score, showValue = true }) {
  const t = riskTier(score)
  return (
    <span className={cx('risk-badge', t.cls)}>
      <span className="dot" />
      {t.label}{showValue && <span className="tabular"> · {score.toFixed(2)}</span>}
    </span>
  )
}

// SIGNATURE ELEMENT: risk score decomposed into its four contributing factors.
// `compact` shows just the bar (no per-factor legend) — used where a shared
// legend already appears once above a grid of many bars.
export function FactorBar({ contributions, factors, animate = true, compact = false }) {
  return (
    <div className="factorbar">
      <div className="factorbar-track" role="img" aria-label="Risk factor breakdown">
        {FACTOR_META.map((f) => (
          <div
            key={f.key}
            className={cx('factorbar-seg', f.seg)}
            style={{ width: `${(contributions[f.key] * 100).toFixed(1)}%`, transition: animate ? undefined : 'none' }}
            title={`${f.label}: +${contributions[f.key].toFixed(2)}`}
          />
        ))}
      </div>
      {!compact && (
        <div className="factor-legend">
          {FACTOR_META.map((f) => (
            <div className="factor-item" key={f.key}>
              <span className="factor-swatch" style={{ background: SEG_COLORS[f.seg] }} />
              <span className="fname">{f.label}</span>
              <span className="fval">
                +{contributions[f.key].toFixed(2)}
                {factors && <span className="muted" style={{ fontWeight: 400 }}> ({factors[f.key].toFixed(2)})</span>}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Shared, single-instance colour key for the factor bars.
export function FactorKey() {
  return (
    <div className="factor-key">
      {FACTOR_META.map((f) => (
        <span className="fk-item" key={f.key}>
          <span className="fk-sw" style={{ background: SEG_COLORS[f.seg] }} />
          {f.label}
        </span>
      ))}
    </div>
  )
}

export function ScoreBlock({ score, caption = 'Risk score' }) {
  const t = riskTier(score)
  return (
    <div className="scorewrap">
      <div className="score-num" style={{ color: t.color }}>{score.toFixed(2)}</div>
      <div>
        <div className="score-cap">{caption}</div>
        <RiskBadge score={score} showValue={false} />
      </div>
    </div>
  )
}

export function Stamp({ children, tone = 'teal' }) {
  return <span className={cx('stamp', tone)}>{children}</span>
}

export function StatTile({ label, value, unit, foot, trend }) {
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <div className="stat-value">
        {value}
        {unit && <small> {unit}</small>}
      </div>
      {foot && <div className={cx('stat-foot', trend && `stat-trend ${trend}`)}>{foot}</div>}
    </div>
  )
}

export function Crumbs({ items }) {
  return (
    <nav className="crumbs">
      {items.map((it, i) => (
        <span key={i}>
          {it.to ? <Link to={it.to}>{it.label}</Link> : <span>{it.label}</span>}
          {i < items.length - 1 && <span className="sep">/</span>}
        </span>
      ))}
    </nav>
  )
}

export function Empty({ title, children }) {
  return (
    <div className="empty">
      <span className="serif">{title}</span>
      {children}
    </div>
  )
}

export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="row" style={{ gap: 4, borderBottom: '1px solid var(--rule)', marginBottom: 20 }}>
      {tabs.map((t) => (
        <button
          key={t.key}
          className="btn ghost"
          onClick={() => onChange(t.key)}
          style={{
            borderRadius: 0,
            borderBottom: active === t.key ? '2px solid var(--teal)' : '2px solid transparent',
            color: active === t.key ? 'var(--teal-deep)' : 'var(--ink-soft)',
            background: 'none',
            fontWeight: active === t.key ? 700 : 500,
            marginBottom: -1,
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
