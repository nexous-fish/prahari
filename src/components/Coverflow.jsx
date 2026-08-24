import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

// Per-card artwork: a soft gradient "sky pane" with a white line motif that
// hints at what the deliverable does. No photos — the cards themselves are the
// imagery, floating like glass panels in the sky.
const ART = {
  engine: {
    grad: 'linear-gradient(135deg, #0aa6c4 0%, #2f7fd8 100%)',
    svg: (
      <>
        <polyline points="24,104 70,86 104,92 150,58 196,66 250,30 278,40" fill="none" stroke="rgba(255,255,255,0.95)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {[[70,86],[104,92],[150,58],[196,66],[250,30]].map(([x,y],i)=>(<circle key={i} cx={x} cy={y} r="3.6" fill="#fff" />))}
        <circle cx="250" cy="30" r="8" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" />
      </>
    ),
  },
  map: {
    grad: 'linear-gradient(135deg, #2f7fd8 0%, #5b6ee0 100%)',
    svg: (
      <>
        {[34,26,18,10].map((r,i)=>(<circle key={i} cx="150" cy="70" r={r*2} fill="none" stroke={`rgba(255,255,255,${0.25+i*0.18})`} strokeWidth="2" />))}
        {[[86,44],[214,52],[196,104]].map(([x,y],i)=>(
          <g key={i}>
            <path d={`M${x} ${y} c-7 0 -12 5 -12 12 c0 8 12 18 12 18 c0 0 12 -10 12 -18 c0 -7 -5 -12 -12 -12 z`} fill="#fff" opacity="0.95" />
            <circle cx={x} cy={y+11} r="3.4" fill="#2f7fd8" />
          </g>
        ))}
      </>
    ),
  },
  lea: {
    grad: 'linear-gradient(135deg, #0d8fb0 0%, #2f7fd8 100%)',
    svg: (
      <>
        <path d="M150 26 L196 44 V78 c0 26 -22 38 -46 46 c-24 -8 -46 -20 -46 -46 V44 Z" fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2.5" strokeLinejoin="round" />
        <path d="M133 70 l12 12 l24 -26" fill="none" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
      </>
    ),
  },
  alerts: {
    grad: 'linear-gradient(135deg, #f0a028 0%, #e5573f 100%)',
    svg: (
      <>
        <path d="M150 40 c-15 0 -24 10 -24 27 c0 18 -8 22 -8 22 h64 s-8 -4 -8 -22 c0 -17 -9 -27 -24 -27 z" fill="none" stroke="rgba(255,255,255,0.95)" strokeWidth="2.6" strokeLinejoin="round" />
        <path d="M142 96 a8 8 0 0 0 16 0" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
        {[[112,66],[188,66]].map(([x,y],i)=>(
          <g key={i} stroke="rgba(255,255,255,0.65)" strokeWidth="2" fill="none" strokeLinecap="round">
            <path d={`M${x} ${y-10} q${x<150?-10:10} 10 0 20`} />
          </g>
        ))}
      </>
    ),
  },
}

function transformFor(offset) {
  if (offset === 0) return { transform: 'translateX(0) translateZ(60px) rotateY(0deg) scale(1)', opacity: 1, zIndex: 30 }
  const dir = offset > 0 ? 1 : -1
  const abs = Math.abs(offset)
  if (abs === 1) return { transform: `translateX(${dir * 64}%) translateZ(-120px) rotateY(${-dir * 34}deg) scale(0.85)`, opacity: 0.98, zIndex: 20 }
  if (abs === 2) return { transform: `translateX(${dir * 112}%) translateZ(-320px) rotateY(${-dir * 40}deg) scale(0.72)`, opacity: 0.5, zIndex: 10 }
  return { transform: `translateX(${dir * 130}%) translateZ(-460px) rotateY(${-dir * 42}deg) scale(0.6)`, opacity: 0, zIndex: 1 }
}

export default function Coverflow({ items }) {
  const N = items.length
  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const nav = useNavigate()
  const reduce = useRef(false)

  useEffect(() => {
    reduce.current = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  }, [])

  // Gentle auto-advance; pauses on hover/focus and when reduced motion is set.
  useEffect(() => {
    if (paused || reduce.current || N <= 1) return
    const t = setInterval(() => setActive((a) => (a + 1) % N), 4800)
    return () => clearInterval(t)
  }, [paused, N])

  const half = Math.floor(N / 2)
  const offsetOf = (i) => {
    let o = i - active
    if (o > half) o -= N
    if (o < -half) o += N
    return o
  }

  return (
    <div
      className="coverflow"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      role="group"
      aria-label="Platform deliverables"
    >
      <div className="cf-stage">
        {items.map((it, i) => {
          const offset = offsetOf(i)
          const st = transformFor(offset)
          const isActive = offset === 0
          const art = ART[it.art] || ART.engine
          return (
            <div
              key={it.key}
              className={'cf-card' + (isActive ? '' : ' is-side')}
              style={st}
              aria-hidden={!isActive}
              onClick={() => (isActive ? nav(it.to) : setActive(i))}
              onKeyDown={(e) => {
                if (isActive && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); nav(it.to) }
              }}
              tabIndex={isActive ? 0 : -1}
              role={isActive ? 'link' : undefined}
            >
              <div className="cf-media" style={{ background: art.grad }}>
                <span className="cf-letter">{it.letter}</span>
                <span className="cf-kind">Deliverable</span>
                <svg viewBox="0 0 300 132" preserveAspectRatio="xMidYMid meet" aria-hidden="true">{art.svg}</svg>
              </div>
              <div className="cf-body">
                <h3 className="cf-title">{it.title}</h3>
                <p className="cf-desc">{it.desc}</p>
                <span className="cf-open">Open {it.kind} <span className="btn-arrow">→</span></span>
              </div>
            </div>
          )
        })}
      </div>

      <div className="cf-controls">
        <div className="cf-dots">
          {items.map((it, i) => (
            <button
              key={it.key}
              className={'cf-dot' + (i === active ? ' on' : '')}
              onClick={() => setActive(i)}
              aria-label={`Show ${it.title}`}
              aria-current={i === active}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
