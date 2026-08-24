import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../lib/store.jsx'
import { SectionHead, Eyebrow, FactorBar } from '../components/ui.jsx'
import IngestButton from '../components/IngestButton.jsx'
import { FACTOR_META, DEFAULT_WEIGHTS } from '../lib/predict.js'
import { relTime, cx } from '../lib/util.js'

const SEG_COLORS = { graph: '#0a9bbf', geo: '#3d84d6', time: '#d98420', distance: '#6c86a3' }

export default function ModelConfig() {
  const app = useApp()
  const isI4C = app.role === 'i4c'
  const [draft, setDraft] = useState({ ...app.weights })
  const sum = Object.values(draft).reduce((a, b) => a + b, 0)
  const norm = Object.fromEntries(Object.entries(draft).map(([k, v]) => [k, v / sum]))
  const dirty = FACTOR_META.some((f) => Math.abs(norm[f.key] - app.weights[f.key]) > 0.005)

  const openCases = app.cases.filter((c) => !['intercepted', 'missed', 'false_positive'].includes(c.status))
  const closed = app.cases.filter((c) => ['intercepted', 'missed', 'false_positive'].includes(c.status))

  function apply() {
    app.setWeights(
      Object.fromEntries(Object.entries(norm).map(([k, v]) => [k, +v.toFixed(3)])),
      'Weights adjusted manually via model configuration',
      { actor: 'I4C' }
    )
  }
  function reset() { setDraft({ ...DEFAULT_WEIGHTS }); }

  // sample contribution preview on a representative score
  const previewContrib = Object.fromEntries(FACTOR_META.map((f) => [f.key, norm[f.key] * 0.8]))

  return (
    <div className="page">
      <div className="container">
        <SectionHead
          eyebrow="Deliverable a · Predictive Analytics Engine"
          title="Explainable weights, and how outcomes move them"
          sub="The prediction is a transparent weighted sum of four factors. Tune them by hand, or let logged field outcomes adjust them automatically."
        />

        <div className="split">
          {/* WEIGHTS */}
          <div className="card pad-lg">
            <Eyebrow>Factor weights</Eyebrow>
            {!isI4C && (
              <div className="note warn" style={{ marginTop: 12 }}>
                Engine configuration is managed by I4C. Weights are shown here for transparency; sign in as I4C to adjust them.
              </div>
            )}
            <div className="mono" style={{ fontSize: '0.82rem', color: 'var(--ink-soft)', background: 'var(--paper-sunk)', padding: '10px 12px', borderRadius: 4, margin: '12px 0 18px' }}>
              Risk = {FACTOR_META.map((f, i) => (
                <span key={f.key}>{i ? ' + ' : ''}<b style={{ color: SEG_COLORS[f.key] }}>{norm[f.key].toFixed(2)}</b>·{f.short}</span>
              ))}
            </div>

            {FACTOR_META.map((f) => {
              const cur = norm[f.key]
              const base = app.weights[f.key]
              const delta = cur - base
              return (
                <div className="weight-row" key={f.key}>
                  <div className="weight-name">
                    {f.label}
                    <small>{f.desc}</small>
                  </div>
                  <input
                    type="range" min="0.05" max="0.6" step="0.01"
                    value={draft[f.key]}
                    disabled={!isI4C}
                    onChange={(e) => setDraft((d) => ({ ...d, [f.key]: Number(e.target.value) }))}
                  />
                  <div className="weight-val">
                    {cur.toFixed(2)}
                    {Math.abs(delta) > 0.005 && <div className={cx('delta', delta > 0 ? 'up' : 'down')}>{delta > 0 ? '+' : ''}{delta.toFixed(2)}</div>}
                  </div>
                </div>
              )
            })}

            <div className="row" style={{ gap: 8, marginTop: 16 }}>
              <button className="btn primary" onClick={apply} disabled={!dirty || !isI4C}>Apply weights</button>
              <button className="btn outline" onClick={reset} disabled={!isI4C}>Reset to baseline</button>
            </div>
            <p className="muted" style={{ fontSize: '0.8rem', marginTop: 12, marginBottom: 0 }}>
              Weights auto-normalise to sum 1.00. Applying re-scores all {app.cases.length} open predictions on next view.
            </p>
          </div>

          {/* OUTCOME LOGGING */}
          <aside className="stack">
            <div className="card">
              <Eyebrow>Log an outcome → close the loop</Eyebrow>
              <p className="muted" style={{ fontSize: '0.86rem', margin: '8px 0 12px' }}>
                Recording a field result reinforces the factor that drove that prediction (on an interception) or dampens it (on a miss / false positive).
              </p>
              {openCases.length === 0 ? (
                <div className="row" style={{ gap: 8, alignItems: 'center' }}>
                  <span className="muted" style={{ fontSize: '0.86rem' }}>No open cases to score.</span>
                  <IngestButton className="btn sm outline" goTo="none">Ingest a complaint</IngestButton>
                </div>
              ) : (
                <div className="stack" style={{ gap: 10 }}>
                  {openCases.slice(0, 4).map((c) => {
                    const top = c.predictions[0]
                    return (
                      <div key={c.id} className="between" style={{ border: '1px solid var(--rule)', borderRadius: 4, padding: '10px 12px' }}>
                        <div>
                          <Link to={`/cases/${c.id}`} className="mono" style={{ fontSize: '0.82rem' }}>{c.id}</Link>
                          <div className="muted" style={{ fontSize: '0.8rem' }}>{top.atm.area} · drives <b>{FACTOR_META.find((f) => f.key === top.topFactor).short}</b></div>
                        </div>
                        <div className="row" style={{ gap: 6 }}>
                          <button className="btn sm ghost" title="Intercepted" onClick={() => app.logOutcome({ caseId: c.id, result: 'intercepted', atmId: top.atm.id })}>✓ Hit</button>
                          <button className="btn sm ghost" title="Missed" onClick={() => app.logOutcome({ caseId: c.id, result: 'missed', atmId: top.atm.id })}>✕ Miss</button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="card">
              <Eyebrow>Weight-adjustment history</Eyebrow>
              <div style={{ marginTop: 8 }}>
                {[...app.weightHistory].reverse().slice(0, 7).map((h, i) => (
                  <div key={i} className="feed-row" style={{ padding: '10px 0' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '0.85rem' }}>{h.reason}</div>
                      <div className="feed-meta">
                        {relTime(h.ts)} ·{' '}
                        {FACTOR_META.map((f, j) => <span key={f.key} className="mono">{j ? ' ' : ''}{f.short.slice(0, 4)} {h.weights[f.key].toFixed(2)}</span>)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>

        {closed.length > 0 && (
          <div className="card" style={{ marginTop: 24 }}>
            <Eyebrow>Feedback ledger · logged outcomes</Eyebrow>
            <table className="ledger" style={{ marginTop: 10 }}>
              <thead><tr><th>Case</th><th>Outcome</th><th>Location</th><th>Effect on model</th></tr></thead>
              <tbody>
                {closed.map((c) => (
                  <tr key={c.id}>
                    <td className="ref"><Link to={`/cases/${c.id}`}>{c.id}</Link></td>
                    <td><span className={cx('pill', c.status === 'intercepted' ? 'good' : 'ox')}>{c.status.replace('_', ' ')}</span></td>
                    <td>{c.outcome ? (c.predictions.find((p) => p.atm.id === c.outcome.atmId)?.atm.area || '-') : '-'}</td>
                    <td className="muted" style={{ fontSize: '0.84rem' }}>{c.status === 'intercepted' ? 'reinforced' : 'dampened'} {FACTOR_META.find((f) => f.key === c.predictions[0].topFactor).short}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
