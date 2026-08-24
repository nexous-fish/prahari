import { useState } from 'react'
import { useApp } from '../lib/store.jsx'
import { SectionHead, Eyebrow, Empty } from '../components/ui.jsx'
import { verifyChain, GENESIS } from '../lib/chain.js'
import { relTime, cx } from '../lib/util.js'

const TYPE_TONE = {
  COMPLAINT_FILED: 'teal',
  PREDICTION_RUN: 'teal',
  ALERT_DISPATCHED: 'amber',
  UNIT_DISPATCHED: 'amber',
  ACCOUNT_FROZEN: 'ox',
  CASE_ACKNOWLEDGED: 'teal',
  OUTCOME_LOGGED: 'good',
  WEIGHTS_UPDATED: 'teal',
}

export default function Evidence() {
  const { evidence } = useApp()
  const [tamperIdx, setTamperIdx] = useState(null)

  // Build a possibly-tampered view to demonstrate chain verification.
  const view = evidence.map((e, i) =>
    i === tamperIdx ? { ...e, payload: { ...e.payload, summary: e.payload.summary + ' [ALTERED]' } } : e
  )
  const broken = verifyChain(view)
  const intact = broken === -1

  return (
    <div className="page">
      <div className="container">
        <SectionHead
          eyebrow="Evidence integrity register · blockchain-anchored"
          title="Tamper-evident audit trail"
          sub="Every complaint, prediction, alert and action is appended to a hash-chained ledger. Each entry commits to the previous entry’s hash, so any edit breaks the chain from that point on."
        />

        {/* integrity banner */}
        <div className={cx('card', 'between')} style={{ borderLeft: `4px solid ${intact ? 'var(--good)' : 'var(--oxblood)'}`, marginBottom: 20 }}>
          <div>
            <div className="mono" style={{ fontSize: '0.72rem', letterSpacing: '0.1em', color: 'var(--muted)' }}>CHAIN STATUS</div>
            <div className="serif" style={{ fontSize: '1.3rem', color: intact ? 'var(--good)' : 'var(--oxblood)' }}>
              {intact ? '✓ Intact' : `✕ Broken at entry #${broken + 1}`}
            </div>
            <div className="muted" style={{ fontSize: '0.84rem' }}>
              {evidence.length} entries · {intact ? 'all hashes verify against their predecessor' : 'downstream hashes no longer match, tampering detected'}
            </div>
          </div>
          <div className="row" style={{ gap: 8 }}>
            {tamperIdx === null ? (
              <button className="btn outline" onClick={() => setTamperIdx(Math.min(2, evidence.length - 1))} disabled={evidence.length === 0}>
                Simulate tampering
              </button>
            ) : (
              <button className="btn primary" onClick={() => setTamperIdx(null)}>Restore chain</button>
            )}
          </div>
        </div>

        {evidence.length === 0 ? (
          <Empty title="Ledger empty">Ingest an NCRP complaint to begin the chain.</Empty>
        ) : (
          <div className="ledger-wrap">
            <table className="ledger">
              <thead>
                <tr><th>#</th><th>Event</th><th>Actor</th><th>Detail</th><th>Case</th><th>Prev → Hash</th><th></th></tr>
              </thead>
              <tbody>
                {view.map((e, i) => {
                  const isBroken = !intact && i >= broken
                  return (
                    <tr key={i} style={isBroken ? { background: 'var(--oxblood-tint)' } : undefined}>
                      <td className="num muted">{String(i + 1).padStart(3, '0')}</td>
                      <td><span className={cx('pill', TYPE_TONE[e.payload.type] || 'teal')} style={{ fontSize: '0.68rem' }}>{e.payload.type.replace(/_/g, ' ')}</span></td>
                      <td style={{ fontSize: '0.84rem' }}>{e.payload.actor}</td>
                      <td className="muted" style={{ fontSize: '0.83rem', maxWidth: 280 }}>{e.payload.summary}</td>
                      <td className="ref" style={{ fontSize: '0.78rem' }}>{e.payload.caseId}</td>
                      <td className="mono" style={{ fontSize: '0.72rem', color: 'var(--muted)' }}>
                        {(e.prevHash === GENESIS ? 'GENESIS' : e.prevHash.slice(0, 8))} → <b style={{ color: isBroken ? 'var(--oxblood)' : 'var(--ink)' }}>{e.hash.slice(0, 8)}</b>
                      </td>
                      <td>{isBroken && <span className="mono" style={{ color: 'var(--oxblood)', fontSize: '0.72rem' }}>✕ break</span>}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        <p className="muted" style={{ fontSize: '0.8rem', marginTop: 14 }}>
          Demo integrity uses a fast non-cryptographic digest to keep everything client-side. In production this anchors to a permissioned ledger (e.g. Hyperledger) with signed writes.
        </p>
      </div>
    </div>
  )
}
