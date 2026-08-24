import { useMemo, useState } from 'react'
import { useApp } from '../lib/store.jsx'
import { SectionHead, Eyebrow, RiskBadge, Empty } from '../components/ui.jsx'
import RiskMap from '../components/RiskMap.jsx'
import { predictLocations } from '../lib/predict.js'
import { FRAUD_CATEGORIES, JURISDICTIONS, categoryLabel } from '../lib/data.js'
import { fmtWindow } from '../lib/util.js'

export default function MapPage() {
  const app = useApp()
  const now = new Date()
  const [caseSel, setCaseSel] = useState('all')
  const [category, setCategory] = useState('all')
  const [jur, setJur] = useState('all')
  const [hour, setHour] = useState(now.getHours())

  const { predictions, lastKnown, contributingCases } = useMemo(() => {
    let relevant = app.cases
    if (caseSel !== 'all') relevant = app.cases.filter((c) => c.id === caseSel)
    if (category !== 'all') relevant = relevant.filter((c) => c.complaint.category === category)

    if (relevant.length === 0) return { predictions: [], lastKnown: null, contributingCases: 0 }

    // Re-score each relevant case at the chosen time window, take per-ATM max.
    const byAtm = {}
    for (const c of relevant) {
      const preds = predictLocations(c.complaint, { weights: app.weights, hour, day: now.getDay() })
      for (const p of preds) {
        if (!byAtm[p.atm.id] || p.score > byAtm[p.atm.id].score) {
          byAtm[p.atm.id] = { ...p, caseId: c.id }
        }
      }
    }
    let arr = Object.values(byAtm)
    if (jur !== 'all') arr = arr.filter((p) => p.atm.jur === jur)
    arr.sort((a, b) => b.score - a.score)
    arr.forEach((p, i) => (p.rank = i + 1))
    return {
      predictions: arr,
      lastKnown: caseSel !== 'all' ? relevant[0].complaint.lastKnown : null,
      contributingCases: relevant.length,
    }
  }, [app.cases, app.weights, caseSel, category, jur, hour, now])

  return (
    <div className="page">
      <div className="container">
        <SectionHead
          eyebrow="Deliverable b · GIS-enabled risk heatmap dashboard"
          title="Risk heatmap: real-time & potential cash-out zones"
          sub="Predicted cash-out points across all active cases, colour-coded by risk over a density surface of historical withdrawals. Drill down by time window, crime category and location. Scroll to zoom, drag to pan."
        />

        {/* filter bar */}
        <div className="card" style={{ padding: '14px 18px', marginBottom: 18 }}>
          <div className="row wrap" style={{ gap: 18, alignItems: 'flex-end' }}>
            <label className="field" style={{ margin: 0, minWidth: 190 }}>
              <label>Case scope</label>
              <select className="select" value={caseSel} onChange={(e) => setCaseSel(e.target.value)}>
                <option value="all">All active cases (aggregate)</option>
                {app.cases.map((c) => <option key={c.id} value={c.id}>{c.id} · {c.predictions[0].atm.area}</option>)}
              </select>
            </label>
            <label className="field" style={{ margin: 0, minWidth: 170 }}>
              <label>Fraud category</label>
              <select className="select" value={category} onChange={(e) => setCategory(e.target.value)}>
                <option value="all">All categories</option>
                {FRAUD_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
              </select>
            </label>
            <label className="field" style={{ margin: 0, minWidth: 160 }}>
              <label>Jurisdiction</label>
              <select className="select" value={jur} onChange={(e) => setJur(e.target.value)}>
                <option value="all">All jurisdictions</option>
                {JURISDICTIONS.map((j) => <option key={j} value={j}>{j}</option>)}
              </select>
            </label>
            <label className="field" style={{ margin: 0, minWidth: 200, flex: 1 }}>
              <label>Time window · <span className="mono">{fmtWindow(hour)}</span></label>
              <input type="range" min="0" max="23" value={hour} onChange={(e) => setHour(Number(e.target.value))} />
            </label>
          </div>
        </div>

        {predictions.length === 0 ? (
          <Empty title="No locations match these filters">
            <span className="muted">Widen the time window, category or jurisdiction to see predicted zones.</span>
          </Empty>
        ) : (
          <div className="split">
            <RiskMap predictions={predictions} lastKnown={lastKnown} height={540} />
            <aside>
              <Eyebrow>Ranked · {predictions.length} locations {contributingCases > 1 ? `· ${contributingCases} cases` : ''}</Eyebrow>
              <div className="ledger-wrap" style={{ marginTop: 10 }}>
                <table className="ledger">
                  <thead><tr><th>#</th><th>Location</th><th className="num">Risk</th></tr></thead>
                  <tbody>
                    {predictions.slice(0, 12).map((p) => (
                      <tr key={p.atm.id}>
                        <td className="num muted">{p.rank}</td>
                        <td>{p.atm.area}<div className="muted mono" style={{ fontSize: '0.72rem' }}>{p.atm.id} · {p.atm.jur}</div></td>
                        <td className="num"><RiskBadge score={p.score} showValue={false} /><div className="mono" style={{ fontSize: '0.76rem' }}>{p.score.toFixed(2)}</div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </aside>
          </div>
        )}
      </div>
    </div>
  )
}
