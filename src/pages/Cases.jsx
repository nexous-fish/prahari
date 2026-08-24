import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../lib/store.jsx'
import { SectionHead, RiskBadge, Stamp, StatTile, Empty } from '../components/ui.jsx'
import IngestButton from '../components/IngestButton.jsx'
import { categoryLabel } from '../lib/data.js'
import { fmtINR, relTime, statusMeta } from '../lib/util.js'

export default function Cases() {
  const { cases } = useApp()
  const nav = useNavigate()
  const [filter, setFilter] = useState('all')

  const filtered = cases.filter((c) => {
    if (filter === 'all') return true
    if (filter === 'open') return !['intercepted', 'missed', 'false_positive'].includes(c.status)
    if (filter === 'closed') return ['intercepted', 'missed', 'false_positive'].includes(c.status)
    return true
  })

  const critical = cases.filter((c) => c.predictions[0].score >= 0.7).length
  const intercepted = cases.filter((c) => c.status === 'intercepted').length

  return (
    <div className="page">
      <div className="container">
        <SectionHead
          eyebrow="Case register"
          title="Active & closed cases"
          sub="Every complaint ingested from the NCRP, its top predicted cash-out and current disposition. Click a row to open the intelligence report."
          right={<IngestButton className="btn primary" goTo="case">Ingest NCRP complaint →</IngestButton>}
        />

        <div className="stat-grid" style={{ marginBottom: 24 }}>
          <StatTile label="Total cases" value={cases.length} />
          <StatTile label="Critical risk" value={critical} foot="score ≥ 0.70" />
          <StatTile label="Intercepted" value={intercepted} foot="confirmed field outcomes" trend="down" />
          <StatTile label="Open" value={cases.filter((c) => !['intercepted', 'missed', 'false_positive'].includes(c.status)).length} />
        </div>

        <div className="row" style={{ gap: 6, marginBottom: 14 }}>
          {['all', 'open', 'closed'].map((f) => (
            <button key={f} className={`btn sm ${filter === f ? 'primary' : 'outline'}`} onClick={() => setFilter(f)} style={{ textTransform: 'capitalize' }}>{f}</button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <Empty title="No cases yet"><IngestButton className="btn sm primary" goTo="case">Ingest the first complaint →</IngestButton></Empty>
        ) : (
          <div className="ledger-wrap">
            <table className="ledger">
              <thead>
                <tr>
                  <th>Case</th><th>Filed</th><th>Category</th><th className="num">Amount</th>
                  <th>Top predicted location</th><th className="num">Risk</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => {
                  const top = c.predictions[0]
                  const sm = statusMeta(c.status)
                  return (
                    <tr key={c.id} className="clickable" onClick={() => nav(`/cases/${c.id}`)}>
                      <td className="ref">{c.id}</td>
                      <td className="muted">{relTime(c.createdAt)}</td>
                      <td>{categoryLabel(c.complaint.category)}</td>
                      <td className="num">{fmtINR(c.complaint.amount, { compact: true })}</td>
                      <td>{top.atm.area} <span className="muted mono" style={{ fontSize: '0.78rem' }}>{top.atm.id}</span></td>
                      <td className="num"><RiskBadge score={top.score} /></td>
                      <td><span className={`pill ${sm.pill}`}>{sm.label}</span></td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
