import { Link } from 'react-router-dom'
import { useApp } from '../lib/store.jsx'
import { SectionHead, Empty } from '../components/ui.jsx'
import IngestButton from '../components/IngestButton.jsx'
import { relTime, cx } from '../lib/util.js'

const CHANNELS = {
  LEA: 'SMS + dispatch → Law Enforcement',
  BANK: 'Secure API → Bank fraud desk',
  MODEL: 'Dashboard → I4C · engine update',
}

export default function Alerts() {
  const { alerts, markRead } = useApp()

  return (
    <div className="page">
      <div className="container">
        <SectionHead
          eyebrow="Deliverable d · Alert & Notification System"
          title="Real-time notifications, every channel"
          sub="The moment a prediction is generated, Praharī pushes notifications to law enforcement, banks and I4C officers over SMS, email, secure API and this dashboard."
          right={<button className="btn outline" onClick={markRead}>Mark all read</button>}
        />

        <div className="card" style={{ padding: '12px 18px', marginBottom: 18 }}>
          <div className="row wrap" style={{ gap: 14, alignItems: 'center' }}>
            <span className="mono" style={{ fontSize: '0.68rem', letterSpacing: '0.12em', color: 'var(--muted)' }}>DELIVERY CHANNELS</span>
            {['SMS', 'Email', 'Secure API', 'Dashboard'].map((c) => <span key={c} className="pill teal" style={{ fontSize: '0.7rem' }}>{c}</span>)}
            <span style={{ flex: 1, minWidth: 12 }} />
            <span className="mono" style={{ fontSize: '0.68rem', letterSpacing: '0.12em', color: 'var(--muted)' }}>RECIPIENTS</span>
            {['Law Enforcement', 'Banks', 'I4C'].map((c) => <span key={c} className="pill" style={{ fontSize: '0.7rem' }}>{c}</span>)}
          </div>
        </div>

        {alerts.length === 0 ? (
          <Empty title="No alerts yet"><IngestButton className="btn sm primary" goTo="none">Ingest a complaint to generate alerts →</IngestButton></Empty>
        ) : (
          <div className="card" style={{ padding: '4px 20px' }}>
            {alerts.map((a) => (
              <div key={a.id} className="feed-row">
                <div className={cx('feed-icon', a.level)} aria-hidden>
                  {a.channel === 'BANK' ? '⌂' : a.channel === 'MODEL' ? '↺' : '◈'}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="between">
                    <b style={{ fontSize: '0.95rem' }}>{a.title}</b>
                    {!a.read && <span className="pill teal" style={{ fontSize: '0.66rem' }}>new</span>}
                  </div>
                  <div className="muted" style={{ fontSize: '0.86rem' }}>{a.body}</div>
                  <div className="feed-meta" style={{ marginTop: 4 }}>
                    {CHANNELS[a.channel] || a.channel} · {relTime(a.ts)}
                    {a.caseId && <> · <Link to={`/cases/${a.caseId}`}>{a.caseId}</Link></>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
