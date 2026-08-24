import { useNavigate, Link } from 'react-router-dom'
import { useApp } from '../lib/store.jsx'
import { SectionHead, RiskBadge, StatTile, Stamp, Empty, Eyebrow } from '../components/ui.jsx'
import IngestButton from '../components/IngestButton.jsx'
import { categoryLabel } from '../lib/data.js'
import { fmtINR, relTime, statusMeta, riskTier, cx } from '../lib/util.js'

export default function LEADashboard() {
  const app = useApp()
  const nav = useNavigate()
  const open = app.cases.filter((c) => !['intercepted', 'missed', 'false_positive'].includes(c.status))
  const sorted = [...app.cases].sort((a, b) => b.predictions[0].score - a.predictions[0].score)
  const leaAlerts = app.alerts.filter((a) => a.channel === 'LEA').slice(0, 6)

  return (
    <div className="page">
      <div className="container">
        <SectionHead
          eyebrow="Deliverable c · Law Enforcement Interface"
          title="Law Enforcement Interface"
          sub="Secure, authenticated access to live alerts, prioritised intelligence reports and evidence documentation. Dispatch a unit to the top predicted cash-out, then log the field outcome to close the loop."
          right={
            <div className="row wrap" style={{ gap: 8, justifyContent: 'flex-end', alignItems: 'center' }}>
              <span className="pill teal" style={{ fontSize: '0.68rem' }}>Secure session · Cyber Cell</span>
              <IngestButton className="btn primary sm" goTo="case">Ingest NCRP complaint</IngestButton>
            </div>
          }
        />

        <div className="stat-grid" style={{ marginBottom: 24 }}>
          <StatTile label="Open cases" value={open.length} />
          <StatTile label="Critical now" value={app.cases.filter((c) => c.predictions[0].score >= 0.7).length} foot="score ≥ 0.70" />
          <StatTile label="Units dispatched" value={app.cases.filter((c) => c.status === 'dispatched').length} />
          <StatTile label="Intercepted" value={app.cases.filter((c) => c.status === 'intercepted').length} trend="down" />
        </div>

        <div className="split">
          <div>
            <Eyebrow>Priority queue · intelligence reports</Eyebrow>
            <div className="ledger-wrap" style={{ marginTop: 10 }}>
              <table className="ledger">
                <thead><tr><th>Case</th><th>Predicted location</th><th className="num">Risk</th><th>ETA</th><th></th></tr></thead>
                <tbody>
                  {sorted.map((c) => {
                    const top = c.predictions[0]
                    const done = ['intercepted', 'missed', 'false_positive'].includes(c.status)
                    return (
                      <tr key={c.id}>
                        <td className="ref"><Link to={`/cases/${c.id}`}>{c.id}</Link><div className="muted" style={{ fontSize: '0.76rem' }}>{categoryLabel(c.complaint.category)}</div></td>
                        <td>{top.atm.area}<div className="muted mono" style={{ fontSize: '0.74rem' }}>{top.atm.jur}</div></td>
                        <td className="num"><RiskBadge score={top.score} /></td>
                        <td className="mono">~{top.etaMins}m</td>
                        <td>
                          {done ? <span className={`pill ${statusMeta(c.status).pill}`}>{statusMeta(c.status).label}</span> : (
                            <button className="btn sm primary" onClick={() => app.caseAction({ caseId: c.id, status: 'dispatched', evType: 'UNIT_DISPATCHED', actor: 'LEA', title: 'Unit dispatched', summary: `Field unit → ${top.atm.area}`, level: riskTier(top.score).key })}>Dispatch</button>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <aside className="stack">
            <div className="card">
              <Eyebrow>Incoming to LEA</Eyebrow>
              <div style={{ marginTop: 8 }}>
                {leaAlerts.length === 0 ? <p className="muted" style={{ fontSize: '0.86rem' }}>No dispatch alerts yet.</p> :
                  leaAlerts.map((a) => (
                    <div key={a.id} className="feed-row">
                      <div className={cx('feed-icon', a.level)}>◈</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{a.title}</div>
                        <div className="muted" style={{ fontSize: '0.82rem' }}>{a.body}</div>
                        <div className="feed-meta">{relTime(a.ts)} · <Link to={`/cases/${a.caseId}`}>{a.caseId}</Link></div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
            <div className="note">Dispatched a unit? Open the case file to log <b>intercepted / missed</b>. That outcome retrains the model’s factor weights.</div>
            <Link to="/evidence" className="card" style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
              <Eyebrow>Evidence documentation</Eyebrow>
              <p className="muted" style={{ fontSize: '0.85rem', margin: '8px 0 0' }}>Every alert, dispatch and outcome is written to a hash-chained, tamper-evident register. Open the evidence trail →</p>
            </Link>
          </aside>
        </div>
      </div>
    </div>
  )
}
