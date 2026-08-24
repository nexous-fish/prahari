import { useMemo, useState } from 'react'
import { fmtINR, cx } from '../lib/util.js'

// Hand-drawn layered SVG of the mule chain. Deliberately structured left→right
// (victim → mule layers → cash-out) so hop depth is legible at a glance.
export default function MuleGraph({ graph, height = 340 }) {
  const [hover, setHover] = useState(null)
  const W = 860
  const H = height
  const padX = 60
  const cols = graph.layers.length
  const colGap = (W - padX * 2) / (cols - 1)

  const pos = useMemo(() => {
    const map = {}
    graph.layers.forEach((layer, li) => {
      const x = padX + li * colGap
      const n = layer.length
      layer.forEach((node, ni) => {
        const slotH = H / (n + 1)
        map[node.id] = { x, y: slotH * (ni + 1), node }
      })
    })
    return map
  }, [graph, colGap, H])

  const maxHopAmt = Math.max(...graph.links.map((l) => l.amountK), 1)

  return (
    <div className="trail-wrap">
      <svg className="trail-svg" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Mule transaction graph">
        {/* links */}
        {graph.links.map((l, i) => {
          const a = pos[l.source]
          const b = pos[l.target]
          if (!a || !b) return null
          const mx = (a.x + b.x) / 2
          const active = hover && (hover === l.source || hover === l.target)
          const w = 1 + (l.amountK / maxHopAmt) * 3.2
          return (
            <g key={i}>
              <path
                d={`M ${a.x + 22} ${a.y} C ${mx} ${a.y}, ${mx} ${b.y}, ${b.x - 22} ${b.y}`}
                fill="none"
                stroke={active ? '#0c5c54' : '#c2c8ba'}
                strokeWidth={active ? w + 0.8 : w}
                opacity={hover && !active ? 0.3 : 0.85}
              />
              {active && (
                <text x={mx} y={(a.y + b.y) / 2 - 6} textAnchor="middle" className="mono" fontSize="11" fill="#0c5c54" fontWeight="600">
                  {fmtINR(l.amountK * 1000, { compact: true })}
                </text>
              )}
            </g>
          )
        })}

        {/* nodes */}
        {Object.values(pos).map(({ x, y, node }) => {
          const isV = node.type === 'victim'
          const isX = node.type === 'cashout'
          const fill = isV ? '#e3ede9' : isX ? '#f0e0de' : '#fbfbf9'
          const stroke = isV ? '#0c5c54' : isX ? '#8a2d2a' : '#bcc1b4'
          const tcol = isV ? '#083f39' : isX ? '#8a2d2a' : '#191d1a'
          return (
            <g
              key={node.id}
              className="node-card"
              onMouseEnter={() => setHover(node.id)}
              onMouseLeave={() => setHover(null)}
              transform={`translate(${x - 42}, ${y - 18})`}
            >
              <rect width="84" height="36" rx="4" fill={fill} stroke={stroke} strokeWidth={hover === node.id ? 2 : 1.2} />
              <text x="42" y="15" textAnchor="middle" fontSize="11" fontWeight="600" fill={tcol} fontFamily="'Libre Franklin', sans-serif">
                {node.label}
              </text>
              {node.acct ? (
                <text x="42" y="27" textAnchor="middle" fontSize="9" fill="#6c746d" fontFamily="'IBM Plex Mono', monospace">
                  a/c {node.acct}
                </text>
              ) : (
                <text x="42" y="27" textAnchor="middle" fontSize="8.5" fill="#6c746d" fontFamily="'IBM Plex Mono', monospace" letterSpacing="0.08em">
                  {isV ? 'ORIGIN' : 'EXIT NODE'}
                </text>
              )}
            </g>
          )
        })}

        {/* layer captions */}
        {graph.layers.map((layer, li) => {
          const x = padX + li * colGap
          const label = li === 0 ? 'VICTIM' : li === graph.layers.length - 1 ? 'CASH-OUT' : `HOP ${li}`
          return (
            <text key={li} x={x} y={H - 8} textAnchor="middle" fontSize="9.5" fill="#9aa199" fontFamily="'IBM Plex Mono', monospace" letterSpacing="0.1em">
              {label}
            </text>
          )
        })}
      </svg>
    </div>
  )
}
