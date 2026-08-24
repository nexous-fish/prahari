import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useApp } from '../lib/store.jsx'
import { Crumbs, Eyebrow, FactorBar, FactorKey, RiskBadge, ScoreBlock, Stamp, Tabs, Empty } from '../components/ui.jsx'
import MuleGraph from '../components/MuleGraph.jsx'
import RiskMap from '../components/RiskMap.jsx'
import { FACTOR_META } from '../lib/predict.js'
import { categoryLabel } from '../lib/data.js'
import { fmtINR, riskTier, statusMeta, fmtWindow, dayName, relTime, cx } from '../lib/util.js'

function whyLine(p) {
  const meta = FACTOR_META.find((f) => f.key === p.topFactor)
  if (p.topFactor === 'graph' && p.bestMatch)
    return `Dominant factor: graph similarity, structurally ${(p.bestMatch.sim * 100).toFixed(0)}% like solved case ${p.bestMatch.id}, which cashed out here.`
  if (p.topFactor === 'geo')
    return `Dominant factor: geo-cluster density, ${p.nearbyPast} historical withdrawals within 1.5 km.`
  if (p.topFactor === 'time')
    return `Dominant factor: time-window probability, this hour/day bucket sees frequent withdrawals near here.`
  return `Dominant factor: distance decay, only ${p.distKm.toFixed(1)} km from the account’s last known activity.`
}

function PredictionCard({ p, onOutcome }) {
  const t = riskTier(p.score)
  return (
    <div className="dossier reveal">
      <div className="dossier-head">
        <div>
          <div className="dossier-ref">{p.atm.id} · RANK #{p.rank}</div>
          <div className="dossier-title">{p.atm.area}</div>
          <div className="muted" style={{ fontSize: '0.82rem' }}>{p.atm.bank} · {p.atm.jur}</div>
        </div>
        <ScoreBlock score={p.score} />
      </div>
      <div className="dossier-body">
        <FactorBar contributions={p.contributions} factors={p.factors} compact />
        <p className="muted" style={{ fontSize: '0.85rem', margin: '12px 0 0' }}>{whyLine(p)}</p>
        <div className="dstat">
          <div><span>ETA</span><b className="mono">~{p.etaMins}m</b></div>
          <div><span>Distance</span><b className="mono">{p.distKm.toFixed(1)} km</b></div>
          <div><span>Nearby</span><b className="mono">{p.nearbyPast}</b></div>
        </div>
        {onOutcome && (
          <div className="row wrap" style={{ gap: 8, marginTop: 14, borderTop: '1px solid var(--rule)', paddingTop: 12 }}>
            <span className="muted" style={{ fontSize: '0.78rem', alignSelf: 'center' }}>Record field outcome:</span>
            <button className="btn sm ghost" onClick={() => onOutcome('intercepted', p.atm.id)}>Intercepted here</button>
            <button className="btn sm ghost" onClick={() => onOutcome('missed', p.atm.id)}>Missed</button>
            <button className="btn sm ghost" onClick={() => onOutcome('false_positive', p.atm.id)}>False positive</button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function CaseView() {
  const { id } = useParams()
  const app = useApp()
  const [tab, setTab] = useState('summary')
  const kase = app.cases.find((c) => c.id === id)

  if (!kase)
    return (
      <div className="page"><div className="container"><Empty title="Case not found"><Link to="/cases">Back to cases</Link></Empty></div></div>
    )

  const { complaint, predictions, graph, status, outcome } = kase
  const top = predictions[0]
  const sm = statusMeta(status)
  const caseAlerts = app.alerts.filter((a) => a.caseId === kase.id)
  const done = ['intercepted', 'missed', 'false_positive'].includes(status)

  function handleOutcome(result, atmId) {
    app.logOutcome({ caseId: kase.id, result, atmId })
  }

  const roleActions = () => {
    if (done) return null
    if (app.role === 'lea')
      return (
        <button className="btn primary" onClick={() => app.caseAction({ caseId: kase.id, status: 'dispatched', evType: 'UNIT_DISPATCHED', actor: 'LEA', title: 'Unit dispatched', summary: `Field unit dispatched to ${top.atm.area}`, level: riskTier(top.score).key })}>
          Dispatch unit → {top.atm.area}
        </button>
      )
    return (
      <button className="btn outline" onClick={() => app.caseAction({ caseId: kase.id, status: 'acknowledged', evType: 'CASE_ACKNOWLEDGED', actor: 'I4C', title: 'Case acknowledged', summary: `${kase.id} acknowledged`, level: 'watch' })}>
        Acknowledge
      </button>
    )
  }

  const tabs = [
    { key: 'summary', label: 'Summary' },
    { key: 'trail', label: 'Money trail' },
    { key: 'predict', label: `Predictions · ${predictions.length}` },
    { key: 'map', label: 'Map' },
  ]

  return (
    <div className="page">
      <div className="container">
        <Crumbs items={[{ label: 'Cases', to: '/cases' }, { label: kase.id }]} />

        {/* case header */}
        <div className="between" style={{ alignItems: 'flex-start', marginBottom: 18 }}>
          <div>
            <Eyebrow>{categoryLabel(complaint.category)} · filed {relTime(kase.createdAt)}</Eyebrow>
            <h1 className="serif" style={{ fontSize: '2rem', fontWeight: 600, margin: '8px 0 4px' }}>
              {kase.id}
            </h1>
            <div className="muted">{complaint.victimName} · {complaint.bank} · <span className="mono">{complaint.accountNo}</span> · {fmtINR(complaint.amount)}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <Stamp tone={sm.tone}>{sm.label}</Stamp>
            <div style={{ marginTop: 12 }}>{roleActions()}</div>
          </div>
        </div>

        <Tabs tabs={tabs} active={tab} onChange={setTab} />

        {tab === 'summary' && (
          <div className="split">
            <div className="stack">
              <div className="card">
                <Eyebrow>Complaint record</Eyebrow>
                <table className="ledger" style={{ marginTop: 10 }}>
                  <tbody>
                    <tr><td className="muted">Complainant</td><td>{complaint.victimName} · <span className="mono">{complaint.victimPhone}</span></td></tr>
                    <tr><td className="muted">Account</td><td className="mono">{complaint.accountNo} · {complaint.bank}</td></tr>
                    <tr><td className="muted">IFSC</td><td className="mono">{complaint.ifsc}</td></tr>
                    <tr><td className="muted">Amount defrauded</td><td className="num">{fmtINR(complaint.amount)}</td></tr>
                    <tr><td className="muted">Category</td><td>{categoryLabel(complaint.category)}</td></tr>
                    <tr><td className="muted">Last known activity</td><td>{complaint.lastKnown.area}</td></tr>
                    <tr><td className="muted">Prediction window</td><td className="mono">{dayName(kase.day)} · {fmtWindow(kase.hour)}</td></tr>
                  </tbody>
                </table>
              </div>
              <div className="card">
                <Eyebrow>Alerts issued for this case</Eyebrow>
                <div style={{ marginTop: 8 }}>
                  {caseAlerts.map((a) => (
                    <div key={a.id} className="feed-row">
                      <div className={cx('feed-icon', a.level)}>▸</div>
                      <div style={{ flex: 1 }}>
                        <div className="between"><b style={{ fontSize: '0.9rem' }}>{a.title}</b><span className="feed-meta">{a.channel} · {relTime(a.ts)}</span></div>
                        <div className="muted" style={{ fontSize: '0.84rem' }}>{a.body}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <aside className="stack">
              <div className="card" style={{ borderTop: `2px solid ${riskTier(top.score).color}` }}>
                <Eyebrow>Top predicted cash-out</Eyebrow>
                <h3 className="serif" style={{ fontSize: '1.4rem', margin: '8px 0 2px' }}>{top.atm.area}</h3>
                <div className="muted" style={{ fontSize: '0.84rem', marginBottom: 12 }}>{top.atm.id} · {top.atm.bank}</div>
                <ScoreBlock score={top.score} />
                <div style={{ marginTop: 14 }}><FactorBar contributions={top.contributions} factors={top.factors} /></div>
                <Link to="#" onClick={(e) => { e.preventDefault(); setTab('predict') }} className="btn outline sm" style={{ marginTop: 16 }}>
                  See all {predictions.length} ranked locations →
                </Link>
              </div>
              {outcome && (
                <div className="note" style={{ background: 'var(--good-tint)', borderColor: '#b6d3c1', color: 'var(--good)' }}>
                  <b>Outcome logged:</b> {outcome.result.replace('_', ' ')} · model weights updated. See <Link to="/engine">the Predictive Engine</Link>.
                </div>
              )}
            </aside>
          </div>
        )}

        {tab === 'trail' && (
          <div className="stack">
            <div className="between">
              <div>
                <Eyebrow>Mule / transaction graph</Eyebrow>
                <p className="muted" style={{ fontSize: '0.88rem', maxWidth: '60ch', marginTop: 6 }}>
                  Reconstructed money trail from victim to cash-out. Hover a node to trace value along each hop. Depth of <b>{complaint.sig.hopDepth} layers</b> across <b>{complaint.sig.muleCount} mule accounts</b> is the structural signature matched against solved cases.
                </p>
              </div>
            </div>
            <MuleGraph graph={graph} />
            <div className="split-3">
              <div className="card"><div className="stat-label">Hop depth</div><div className="serif" style={{ fontSize: '1.6rem' }}>{complaint.sig.hopDepth} layers</div></div>
              <div className="card"><div className="stat-label">Mule accounts</div><div className="serif" style={{ fontSize: '1.6rem' }}>{complaint.sig.muleCount}</div></div>
              <div className="card">
                <div className="stat-label">Closest solved case</div>
                <div className="serif" style={{ fontSize: '1.6rem' }}>{top.bestMatch?.id || '-'}</div>
                <div className="muted" style={{ fontSize: '0.82rem' }}>{top.bestMatch ? `${(top.bestMatch.sim * 100).toFixed(0)}% structural match · cashed out ${top.bestMatch.cashOut.area}` : ''}</div>
              </div>
            </div>
          </div>
        )}

        {tab === 'predict' && (
          <div className="stack">
            <div className="predict-head">
              <p className="muted" style={{ margin: 0, fontSize: '0.86rem', maxWidth: '52ch' }}>
                Every location is scored from the same four factors. The bar on each card shows what drove that score.
              </p>
              <FactorKey />
            </div>
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))' }}>
              {predictions.slice(0, 9).map((p) => (
                <PredictionCard key={p.atm.id} p={p} onOutcome={done ? null : handleOutcome} />
              ))}
            </div>
          </div>
        )}

        {tab === 'map' && (
          <div className="stack">
            <Eyebrow>GIS risk surface · this case</Eyebrow>
            <RiskMap predictions={predictions} lastKnown={complaint.lastKnown} height={520} />
          </div>
        )}
      </div>
    </div>
  )
}
