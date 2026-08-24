import { useEffect, useRef, useState } from 'react'
import L from 'leaflet'
import { riskTier } from '../lib/util.js'
import { WITHDRAWAL_HISTORY } from '../lib/data.js'

// Leaflet map plotting predicted ATMs (risk-colored) over a soft density layer
// built from historical withdrawal points.
export default function RiskMap({ predictions, lastKnown, height = 460, showHistory = true, onSelect }) {
  const elRef = useRef(null)
  const mapRef = useRef(null)
  const layerRef = useRef(null)
  const [full, setFull] = useState(false)

  useEffect(() => {
    if (mapRef.current) return
    const map = L.map(elRef.current, {
      center: [28.63, 77.19],
      zoom: 11,
      scrollWheelZoom: true,
      attributionControl: true,
    })
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap · © CARTO',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map)
    mapRef.current = map
    layerRef.current = L.layerGroup().addTo(map)
    return () => {
      map.remove()
      mapRef.current = null
      layerRef.current = null
    }
  }, [])

  useEffect(() => {
    const map = mapRef.current
    const layer = layerRef.current
    if (!map || !layer) return
    layer.clearLayers()

    // density "heat": translucent stacked circles from history
    if (showHistory) {
      WITHDRAWAL_HISTORY.forEach((p) => {
        L.circle([p.lat, p.lng], {
          radius: 260,
          stroke: false,
          fillColor: '#d8384f',
          fillOpacity: 0.05,
        }).addTo(layer)
      })
    }

    // last-known activity marker
    if (lastKnown) {
      L.marker([lastKnown.lat, lastKnown.lng], {
        icon: L.divIcon({
          className: '',
          html: `<div style="width:14px;height:14px;border-radius:50%;background:#0f2942;border:3px solid #fff;box-shadow:0 0 0 2px #0f2942"></div>`,
          iconSize: [14, 14],
          iconAnchor: [7, 7],
        }),
      })
        .bindTooltip(`Last known activity · ${lastKnown.area}`, { direction: 'top' })
        .addTo(layer)
    }

    // predicted ATMs
    const top = predictions.slice(0, 12)
    top.forEach((p) => {
      const t = riskTier(p.score)
      const r = 9 + p.score * 16
      const c = L.circleMarker([p.atm.lat, p.atm.lng], {
        radius: r,
        color: t.color,
        weight: 2,
        fillColor: t.color,
        fillOpacity: 0.28,
      }).addTo(layer)
      c.bindPopup(
        `<div class="map-pop-ref">${p.atm.id} · rank #${p.rank}</div>
         <div class="map-pop-title">${p.atm.area}</div>
         <div style="font-size:0.82rem;color:#37516b">
           ${t.label} · risk <b>${p.score.toFixed(2)}</b><br/>
           ${p.atm.bank}<br/>
           ~${p.etaMins}m ETA · ${p.distKm.toFixed(1)} km from origin
         </div>`
      )
      if (onSelect) c.on('click', () => onSelect(p))
      if (p.rank <= 3) {
        L.marker([p.atm.lat, p.atm.lng], {
          icon: L.divIcon({
            className: '',
            html: `<div style="font:600 10px 'IBM Plex Mono',monospace;color:${t.color};background:#ffffff;border:1px solid ${t.color};border-radius:4px;padding:0 4px;white-space:nowrap;transform:translate(12px,-22px)">#${p.rank} ${p.atm.area}</div>`,
            iconSize: [0, 0],
          }),
          interactive: false,
        }).addTo(layer)
      }
    })

    // fit
    const pts = top.map((p) => [p.atm.lat, p.atm.lng])
    if (lastKnown) pts.push([lastKnown.lat, lastKnown.lng])
    if (pts.length) map.fitBounds(pts, { padding: [40, 40], maxZoom: 13 })
  }, [predictions, lastKnown, showHistory, onSelect])

  // Full screen: resize the Leaflet canvas after the container changes size,
  // lock body scroll, and allow Esc to exit.
  useEffect(() => {
    const map = mapRef.current
    if (!map) return
    map.invalidateSize()
    const t = setTimeout(() => map.invalidateSize(), 220)
    return () => clearTimeout(t)
  }, [full])

  useEffect(() => {
    if (!full) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e) => { if (e.key === 'Escape') setFull(false) }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [full])

  return (
    <div className={'map-shell' + (full ? ' is-full' : '')}>
      <div ref={elRef} style={{ height: full ? '100%' : height }} />
      <button
        className="map-fs"
        onClick={() => setFull((f) => !f)}
        aria-label={full ? 'Exit full screen' : 'View map full screen'}
        title={full ? 'Exit full screen (Esc)' : 'Full screen'}
      >
        {full ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3v3a2 2 0 0 1-2 2H3M21 8h-3a2 2 0 0 1-2-2V3M3 16h3a2 2 0 0 1 2 2v3M16 21v-3a2 2 0 0 1 2-2h3" /></svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M16 21h3a2 2 0 0 0 2-2v-3" /></svg>
        )}
      </button>
      <div className="map-legend">
        <div className="lg-row"><span className="lg-dot" style={{ background: '#d8384f' }} />Critical ≥ 0.70</div>
        <div className="lg-row"><span className="lg-dot" style={{ background: '#d98420' }} />Elevated ≥ 0.45</div>
        <div className="lg-row"><span className="lg-dot" style={{ background: '#0a9bbf' }} />Watch &lt; 0.45</div>
        <div className="lg-row"><span className="lg-dot" style={{ background: '#0f2942' }} />Last known</div>
      </div>
    </div>
  )
}
