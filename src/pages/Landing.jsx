import { Fragment } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../lib/store.jsx'
import { StatTile } from '../components/ui.jsx'
import IngestButton from '../components/IngestButton.jsx'
import Coverflow from '../components/Coverflow.jsx'
import { fmtNum } from '../lib/util.js'
import { WITHDRAWAL_HISTORY, PAST_CASES, ATMS } from '../lib/data.js'

// The four deliverables, as floating glass panels in the coverflow.
const DECK = [
  {
    key: 'engine', letter: 'a', to: '/engine', art: 'engine', kind: 'engine',
    title: 'Predictive Analytics Engine',
    desc: 'Scores every candidate cash-out point by reading the mule network and matching it to solved cases. Weights are visible and adjustable.',
  },
  {
    key: 'map', letter: 'b', to: '/map', art: 'map', kind: 'heatmap',
    title: 'Risk Heatmap Dashboard',
    desc: 'A live GIS surface of predicted and historical risk zones, ranked and drillable by time, location and crime category.',
  },
  {
    key: 'lea', letter: 'c', to: '/lea', art: 'lea', kind: 'interface',
    title: 'Law Enforcement Interface',
    desc: 'A secure workspace for investigators: prioritised intelligence reports, one-tap dispatch, and evidence documentation.',
  },
  {
    key: 'alerts', letter: 'd', to: '/alerts', art: 'alerts', kind: 'alerts',
    title: 'Alert & Notification System',
    desc: 'Real-time notifications to law enforcement, banks and I4C the moment a high-risk prediction lands, over every channel.',
  },
]

const PIPE = [
  { label: 'Complaint', sub: 'via NCRP API' },
  { label: 'Mule graph', sub: 'chain extracted' },
  { label: 'Prediction', sub: '4-factor score' },
  { label: 'Alerts', sub: 'LEA · bank · I4C' },
  { label: 'Intercept', sub: 'field action' },
  { label: 'Outcome', sub: 'weights adjust', final: true },
]

export default function Landing() {
  const { cases } = useApp()

  return (
    <div className="page" style={{ paddingTop: 6 }}>
      {/* HERO */}
      <section className="hero">
        <div className="hero-sky" aria-hidden="true" />
        <div className="container hero-inner">
          <span className="hero-badge reveal">Ministry of Home Affairs · I4C · CIS Division</span>
          <h1 className="reveal d1">
            Forecasting the cash-out,<br /><span className="accent">before the money moves.</span>
          </h1>
          <p className="hero-lead reveal d2">
            Over <b>8,000 cybercrime complaints</b> reach the NCRP every day, and the window to
            recover funds is measured in minutes. Praharī reads the account’s mule network,
            compares it to solved cases, and predicts <b>where</b> the cash will be withdrawn.
          </p>
          <div className="hero-cta reveal d2">
            <IngestButton className="btn primary lg" goTo="case">
              Simulate an NCRP complaint <span className="btn-arrow">→</span>
            </IngestButton>
            <Link to="/map" className="btn outline lg">Open the risk heatmap</Link>
          </div>

          <Coverflow items={DECK} />
          <p className="hero-hint">Four components, one pipeline · select a panel to open it</p>
        </div>
      </section>

      {/* live numbers */}
      <section className="container" style={{ marginTop: 40 }}>
        <div className="stat-grid">
          <StatTile label="Active cases in system" value={fmtNum(cases.length)} foot="Live through the pipeline" />
          <StatTile label="Candidate cash-out points" value={fmtNum(ATMS.length)} foot="ATMs / cash agents · Delhi NCR" />
          <StatTile label="Historical withdrawals" value={fmtNum(WITHDRAWAL_HISTORY.length)} foot="Synthetic training signal" />
          <StatTile label="Solved cases matched" value={fmtNum(PAST_CASES.length)} foot="Structural graph library" />
        </div>
      </section>

      {/* from reactive to proactive */}
      <section className="container" style={{ marginTop: 44 }}>
        <div className="card pad-lg reveal">
          <span className="eyebrow">The shift Praharī makes</span>
          <h2 className="section-title" style={{ marginBottom: 6 }}>From reactive freeze to proactive intercept.</h2>
          <p className="muted" style={{ margin: 0, maxWidth: '60ch' }}>
            Today, funds are frozen only after they are withdrawn. Praharī moves the response
            upstream, to the minutes before the money leaves the system.
          </p>
          <div className="shift-compare">
            <div className="shift-panel past">
              <div className="sp-when">Today</div>
              <div className="sp-head">Reactive</div>
              <p className="sp-desc">Complaint filed, funds traced, freeze requested, long after the cash is already gone.</p>
              <span className="sp-tag">Freeze after withdrawal</span>
            </div>
            <div className="shift-arrow" aria-hidden="true">
              <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
            </div>
            <div className="shift-panel now">
              <div className="sp-when">With Praharī</div>
              <div className="sp-head">Proactive</div>
              <p className="sp-desc">Cash-out point predicted and units alerted while the money is still moving through mules.</p>
              <span className="sp-tag">Intercept before withdrawal</span>
            </div>
          </div>
        </div>
      </section>

      {/* PIPELINE */}
      <section className="container" style={{ marginTop: 40 }}>
        <div className="card pad-lg">
          <span className="eyebrow">How it works · complaint-to-intercept pipeline</span>
          <div className="pipeflow">
            {PIPE.map((s, i) => (
              <Fragment key={s.label}>
                <div className={'pipe-node' + (s.final ? ' final' : '')}>
                  <div className="pn-top">
                    <span className="pn-num">{i + 1}</span>
                    <span className="pn-label">{s.label}</span>
                  </div>
                  <span className="pn-sub">{s.sub}</span>
                </div>
                {i < PIPE.length - 1 && <span className="pipe-arrow" aria-hidden="true">›</span>}
              </Fragment>
            ))}
          </div>
          <hr className="hr" />
          <div className="explain-3">
            <div className="explain-item">
              <div className="ex-label">EXPLAINABLE BY DESIGN</div>
              <p>Risk = w₁·GraphSim + w₂·GeoDensity + w₃·TimeProb + w₄·DistanceDecay. Every weight is visible and adjustable.</p>
            </div>
            <div className="explain-item">
              <div className="ex-label">ONE SHARED LAYER</div>
              <p>I4C tunes the engine, law enforcement dispatches units, banks are notified, all on the same live case feed.</p>
            </div>
            <div className="explain-item">
              <div className="ex-label">TAMPER-EVIDENT</div>
              <p>Every alert and action is written to a hash-chained evidence register: a court-defensible trail.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container" style={{ marginTop: 40 }}>
        <div className="between card pad-lg" style={{ background: 'var(--teal-tint)', borderColor: '#b3e3ee' }}>
          <div>
            <h3 className="serif" style={{ fontSize: '1.35rem', color: 'var(--teal-deep)' }}>See it run end-to-end.</h3>
            <p className="muted" style={{ margin: '4px 0 0', maxWidth: '54ch' }}>Simulate an incoming NCRP complaint and watch the prediction, alerts, map and feedback loop fire in sequence.</p>
          </div>
          <IngestButton className="btn primary lg" goTo="case" style={{ whiteSpace: 'nowrap' }}>Simulate a complaint →</IngestButton>
        </div>
      </section>
    </div>
  )
}
