import { NavLink, Link } from 'react-router-dom'
import { useApp, ROLES } from '../lib/store.jsx'

function Identity() {
  const { role, logout } = useApp()
  const r = ROLES[role]
  if (!r) return null
  return (
    <div className="row" style={{ gap: 10, alignItems: 'center' }}>
      <span className="role-chip" style={{ cursor: 'default' }} title={`${r.org} · ${r.unit}`}>
        <span className="role-dot" />
        {r.name}
      </span>
      <button className="btn sm outline" onClick={logout}>Sign out</button>
    </div>
  )
}

const NAV = [
  { to: '/', label: 'Overview', end: true },
  { to: '/engine', label: 'Predictive Engine' },
  { to: '/map', label: 'Risk Heatmap' },
  { to: '/lea', label: 'LEA Interface' },
  { to: '/alerts', label: 'Alerts' },
]

function AlertBell() {
  const { alerts } = useApp()
  const unread = alerts.filter((a) => !a.read).length
  return (
    <NavLink to="/alerts" className="role-chip" style={{ gap: 6 }} title="Live alert feed" aria-label={`Alerts, ${unread} unread`}>
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      {unread > 0 && <span className="pill ox" style={{ fontSize: '0.66rem', padding: '1px 6px' }}>{unread}</span>}
    </NavLink>
  )
}

export default function Masthead() {
  return (
    <header className="masthead">
      <div className="container masthead-bar">
        <Link to="/" className="brand" aria-label="Praharī home">
          <span className="brand-mark" aria-hidden>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2 4 6v6c0 5 3.5 8 8 10 4.5-2 8-5 8-10V6z" />
              <path d="M12 11v4" />
              <circle cx="12" cy="8.5" r="1" fill="currentColor" stroke="none" />
            </svg>
          </span>
          <span className="brand-name">Praharī</span>
        </Link>

        <nav className="mainnav">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} className={({ isActive }) => (isActive ? 'active' : '')}>
              {n.label}
            </NavLink>
          ))}
        </nav>

        <div className="masthead-right">
          <AlertBell />
          <Identity />
        </div>
      </div>
    </header>
  )
}
