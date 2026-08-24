// Shared helpers: geo math, deterministic RNG, formatting, risk tiers.

export function clamp(x, lo = 0, hi = 1) {
  return Math.max(lo, Math.min(hi, x))
}

// Haversine distance in km between {lat,lng} points.
export function haversineKm(a, b) {
  const R = 6371
  const dLat = ((b.lat - a.lat) * Math.PI) / 180
  const dLng = ((b.lng - a.lng) * Math.PI) / 180
  const la1 = (a.lat * Math.PI) / 180
  const la2 = (b.lat * Math.PI) / 180
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

// Deterministic PRNG so the synthetic dataset is stable across reloads.
export function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// Indian-grouped rupee formatting (₹ 12,45,000).
export function fmtINR(amount, { compact = false } = {}) {
  if (compact) {
    if (amount >= 1e7) return `₹${(amount / 1e7).toFixed(2)} Cr`
    if (amount >= 1e5) return `₹${(amount / 1e5).toFixed(2)} L`
    if (amount >= 1e3) return `₹${(amount / 1e3).toFixed(0)}K`
  }
  return '₹' + new Intl.NumberFormat('en-IN').format(Math.round(amount))
}

export function fmtNum(n, digits = 0) {
  return new Intl.NumberFormat('en-IN', { maximumFractionDigits: digits }).format(n)
}

// Risk tier lookup used everywhere (badges, map, dossiers).
export function riskTier(score) {
  if (score >= 0.7) return { key: 'critical', label: 'Critical', cls: 'risk-critical', color: '#d8384f' }
  if (score >= 0.45) return { key: 'elevated', label: 'Elevated', cls: 'risk-elevated', color: '#d98420' }
  return { key: 'watch', label: 'Watch', cls: 'risk-watch', color: '#0a9bbf' }
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
export function dayName(d) { return DAYS[d] }

export function fmtHour(h) {
  const ampm = h < 12 ? 'AM' : 'PM'
  const hr = h % 12 === 0 ? 12 : h % 12
  return `${String(hr).padStart(2, '0')}:00 ${ampm}`
}

export function fmtWindow(h) {
  const end = (h + 1) % 24
  return `${String(h).padStart(2, '0')}:00–${String(end).padStart(2, '0')}:00`
}

export function relTime(ts, now = Date.now()) {
  const s = Math.max(0, Math.round((now - ts) / 1000))
  if (s < 60) return `${s}s ago`
  const m = Math.round(s / 60)
  if (m < 60) return `${m}m ago`
  const hr = Math.round(m / 60)
  if (hr < 24) return `${hr}h ago`
  return `${Math.round(hr / 24)}d ago`
}

export function cx(...parts) {
  return parts.filter(Boolean).join(' ')
}

// Case status → label + stamp tone, shared across pages.
export const STATUS_META = {
  predicted:      { label: 'Predicted',      tone: 'teal',  pill: 'teal' },
  dispatched:     { label: 'Unit dispatched',tone: 'amber', pill: 'amber' },
  acknowledged:   { label: 'Acknowledged',   tone: 'teal',  pill: 'teal' },
  frozen:         { label: 'Account frozen', tone: 'ox',    pill: 'ox' },
  intercepted:    { label: 'Intercepted',    tone: 'good',  pill: 'good' },
  missed:         { label: 'Missed',         tone: 'ox',    pill: 'ox' },
  false_positive: { label: 'False positive', tone: 'amber', pill: 'amber' },
}
export function statusMeta(status) {
  return STATUS_META[status] || { label: status, tone: 'teal', pill: 'teal' }
}
