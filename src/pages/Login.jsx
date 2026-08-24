import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../lib/store.jsx'
import { Eyebrow } from '../components/ui.jsx'

const TIERS = [
  {
    key: 'i4c',
    name: 'I4C',
    org: 'Indian Cybercrime Coordination Centre',
    blurb: 'National coordination. Configure the predictive engine and oversee every local unit.',
  },
  {
    key: 'lea',
    name: 'LEA',
    org: 'Law Enforcement Agency',
    blurb: 'Local operations. Work alerts and intelligence reports, dispatch units, document evidence.',
  },
]

// Prototype credentials (client-side, synthetic). Pre-filled on tier select.
const CREDS = {
  i4c: { id: 'i4c-control', pass: 'i4c@2026' },
  lea: { id: 'lea-delhi', pass: 'lea@2026' },
}

export default function Login() {
  const app = useApp()
  const nav = useNavigate()
  const [tier, setTier] = useState('i4c')
  const [id, setId] = useState(CREDS.i4c.id)
  const [pass, setPass] = useState(CREDS.i4c.pass)
  const [error, setError] = useState('')

  const activeTier = TIERS.find((t) => t.key === tier)

  function pick(k) {
    setTier(k)
    setId(CREDS[k].id)
    setPass(CREDS[k].pass)
    setError('')
  }

  function submit(e) {
    e.preventDefault()
    const c = CREDS[tier]
    if (id.trim() === c.id && pass === c.pass) {
      app.login(tier)
      nav(tier === 'lea' ? '/lea' : '/', { replace: true })
    } else {
      setError('Invalid credentials for this access tier.')
    }
  }

  return (
    <div className="gate">
      <div style={{ width: '100%', maxWidth: 460 }}>
        <div className="gate-brand">
          <span className="brand-mark" aria-hidden>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2 4 6v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6z" />
              <path d="M12 11v4" />
              <circle cx="12" cy="8.5" r="1" fill="currentColor" stroke="none" />
            </svg>
          </span>
          <div>
            <div className="serif" style={{ fontSize: '1.55rem', fontWeight: 600, lineHeight: 1 }}>Praharī</div>
            <div className="mono" style={{ fontSize: '0.63rem', letterSpacing: '0.14em', color: 'var(--muted)', textTransform: 'uppercase', marginTop: 5 }}>
              Predictive Withdrawal Intelligence
            </div>
          </div>
        </div>

        <form className="gate-card" onSubmit={submit}>
          <Eyebrow>Secure sign-in</Eyebrow>
          <h1 className="serif" style={{ fontSize: '1.42rem', margin: '10px 0 4px' }}>Sign in to continue</h1>
          <p className="muted" style={{ fontSize: '0.86rem', marginTop: 0, marginBottom: 6 }}>
            Access is restricted to authorised personnel. Select your access tier.
          </p>

          <div className="tierseg" role="group" aria-label="Access tier">
            {TIERS.map((t) => (
              <button
                type="button"
                key={t.key}
                className={'tieropt' + (tier === t.key ? ' on' : '')}
                onClick={() => pick(t.key)}
                aria-pressed={tier === t.key}
              >
                <div className="t-name">{t.name}</div>
                <div className="t-org">{t.org}</div>
              </button>
            ))}
          </div>

          <div className="note" style={{ marginBottom: 18 }}>{activeTier.blurb}</div>

          <label className="field">
            <label>Personnel identifier</label>
            <input
              className="input mono"
              value={id}
              onChange={(e) => { setId(e.target.value); setError('') }}
              autoComplete="username"
              spellCheck={false}
            />
          </label>
          <label className="field">
            <label>Passcode</label>
            <input
              className="input mono"
              type="password"
              value={pass}
              onChange={(e) => { setPass(e.target.value); setError('') }}
              autoComplete="current-password"
            />
          </label>

          {error && <div className="note warn" style={{ marginBottom: 16 }}>{error}</div>}

          <button type="submit" className="btn primary lg" style={{ width: '100%' }}>
            Sign in as {activeTier.name} <span aria-hidden>→</span>
          </button>

          <p className="muted" style={{ fontSize: '0.75rem', marginTop: 16, marginBottom: 0, textAlign: 'center' }}>
            Prototype · synthetic data only · demo credentials pre-filled
          </p>
        </form>

        <p className="mono" style={{ fontSize: '0.62rem', letterSpacing: '0.18em', color: 'var(--rule-strong)', textTransform: 'uppercase', textAlign: 'center', marginTop: 18 }}>
          Restricted · Authorised personnel only
        </p>
      </div>
    </div>
  )
}
