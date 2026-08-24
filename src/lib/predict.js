// Transparent, rule-based prediction. Deliberately NOT a black box.
//
//   Risk(location) = w1·GraphSimilarity + w2·GeoClusterDensity
//                  + w3·TimeWindowProbability + w4·DistanceDecay
//
// Every factor is returned per location so the UI can show the "why",
// not just a final number.

import { ATMS, WITHDRAWAL_HISTORY, PAST_CASES } from './data.js'
import { haversineKm, clamp } from './util.js'

export const DEFAULT_WEIGHTS = { graph: 0.34, geo: 0.24, time: 0.18, distance: 0.24 }

export const FACTOR_META = [
  { key: 'graph',    label: 'Graph similarity',        short: 'GraphSim',  seg: 'f1', desc: 'How closely the account’s mule-chain structure matches solved past cases.' },
  { key: 'geo',      label: 'Geo-cluster density',     short: 'GeoDensity',seg: 'f2', desc: 'Density of historical cash-out points near this location (DBSCAN-style).' },
  { key: 'time',     label: 'Time-window probability', short: 'TimeProb',  seg: 'f3', desc: 'Frequency of past withdrawals in the current hour-of-day / day bucket.' },
  { key: 'distance', label: 'Distance decay',          short: 'DistDecay', seg: 'f4', desc: 'Proximity to the account’s last known activity (inverse-distance).' },
]

// ---- structural similarity between two mule-chain signatures ----
const SIG_RANGES = { hopDepth: 4, muleCount: 9, fanOut: 1.6, avgHopAmountK: 285, speedMins: 32 }
function sigSimilarity(a, b) {
  const keys = Object.keys(SIG_RANGES)
  let sum = 0
  for (const k of keys) sum += clamp(Math.abs(a[k] - b[k]) / SIG_RANGES[k], 0, 1)
  return 1 - sum / keys.length // 1 = identical structure
}

// exp kernel by distance
function kernel(dKm, sigma) {
  return Math.exp(-((dKm / sigma) ** 2))
}

function normalizeByMax(map) {
  const max = Math.max(...Object.values(map), 1e-9)
  const out = {}
  for (const k in map) out[k] = map[k] / max
  return out
}

// ---------------------------------------------------------------------------
// Main prediction. Returns ranked locations with per-factor breakdown.
// opts: { hour, day, weights }
// ---------------------------------------------------------------------------
export function predictLocations(complaint, opts = {}) {
  const weights = opts.weights || DEFAULT_WEIGHTS
  const hour = opts.hour ?? new Date().getHours()
  const day = opts.day ?? new Date().getDay()
  const lastKnown = complaint.lastKnown

  // Pre-compute per-case structural similarity to this complaint.
  const caseSim = PAST_CASES.map((pc) => ({
    pc,
    sim: clamp(sigSimilarity(complaint.sig, pc.sig) * (pc.category === complaint.category ? 1 : 0.82), 0, 1),
  }))

  const rawGraph = {}
  const rawGeo = {}
  const rawTime = {}
  const rawDist = {}
  const bestMatch = {}

  for (const atm of ATMS) {
    // 1. Graph similarity: best (similar solved case) that cashed out near here
    let best = 0
    let bestCase = null
    for (const { pc, sim } of caseSim) {
      const prox = kernel(haversineKm(atm, pc.cashOut), 1.3)
      const s = sim * prox
      if (s > best) { best = s; bestCase = { ...pc, sim } }
    }
    rawGraph[atm.id] = best
    bestMatch[atm.id] = bestCase

    // 2. Geo-cluster density: KDE over historical withdrawals
    let dens = 0
    let near = 0
    for (const p of WITHDRAWAL_HISTORY) {
      const d = haversineKm(atm, p)
      dens += kernel(d, 0.8)
      if (d <= 1.5) near++
    }
    rawGeo[atm.id] = dens

    // 3. Time-window probability: local hour/day affinity, blended w/ global
    const local = WITHDRAWAL_HISTORY.filter((p) => haversineKm(atm, p) <= 1.8)
    const weekend = day === 0 || day === 6
    const bucketMatch = (p) =>
      Math.abs(p.hour - hour) <= 1 && (p.day === 0 || p.day === 6) === weekend
    let timeProb
    if (local.length >= 5) {
      timeProb = local.filter(bucketMatch).length / local.length
    } else {
      const g = WITHDRAWAL_HISTORY.filter(bucketMatch).length / WITHDRAWAL_HISTORY.length
      timeProb = g
    }
    rawTime[atm.id] = clamp(timeProb * 3.2, 0, 1) // scale sparse fractions into a usable range

    // 4. Distance decay from last known activity
    const d = haversineKm(atm, lastKnown)
    rawDist[atm.id] = 1 / (1 + (d / 3.0) ** 2)

    atm._near = near
    atm._distKm = d
  }

  const gN = normalizeByMax(rawGraph)
  const geoN = normalizeByMax(rawGeo)
  const tN = normalizeByMax(rawTime)
  const dN = normalizeByMax(rawDist)

  const results = ATMS.map((atm) => {
    const factors = {
      graph: gN[atm.id],
      geo: geoN[atm.id],
      time: tN[atm.id],
      distance: dN[atm.id],
    }
    const contributions = {
      graph: weights.graph * factors.graph,
      geo: weights.geo * factors.geo,
      time: weights.time * factors.time,
      distance: weights.distance * factors.distance,
    }
    const score = contributions.graph + contributions.geo + contributions.time + contributions.distance
    const topFactor = Object.entries(contributions).sort((a, b) => b[1] - a[1])[0][0]
    const etaMins = Math.round(6 + (atm._distKm / 22) * 60)
    return {
      atm,
      score,
      factors,
      contributions,
      topFactor,
      etaMins,
      distKm: atm._distKm,
      nearbyPast: atm._near,
      bestMatch: bestMatch[atm.id],
    }
  })

  results.sort((a, b) => b.score - a.score)
  results.forEach((r, i) => (r.rank = i + 1))
  return results
}

// ---------------------------------------------------------------------------
// Build a layered mule-transaction graph from the complaint's signature.
// Deterministic per account so it's stable across renders.
// ---------------------------------------------------------------------------
function strHash(s) {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function buildMuleGraph(complaint) {
  const seedBase = strHash(complaint.accountNo + complaint.victimName)
  let s = seedBase
  const rand = () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0
    return s / 4294967296
  }

  const { hopDepth, fanOut, muleCount } = complaint.sig
  const total = complaint.amount

  // Column layout: 0 = victim, 1..(hopDepth-1) = mule layers, hopDepth = cash-out
  const layers = []
  layers.push([{ id: 'V', type: 'victim', label: complaint.victimName.split(' ')[0], layer: 0 }])

  const muleLayers = Math.max(1, hopDepth - 1)
  let placed = 0
  for (let L = 1; L <= muleLayers; L++) {
    let size
    if (L === muleLayers) size = 1 // converge to a single exit mule
    else size = clamp(Math.round(fanOut + (L === 1 ? 0.4 : 0) + rand() * 0.6), 1, 4)
    size = Math.min(size, Math.max(1, muleCount - placed - (muleLayers - L)))
    const layerNodes = []
    for (let i = 0; i < size; i++) {
      placed++
      layerNodes.push({
        id: `M${L}-${i}`,
        type: 'mule',
        label: `Mule ${placed}`,
        acct: `••${Math.floor(1000 + rand() * 8999)}`,
        layer: L,
      })
    }
    layers.push(layerNodes)
  }

  layers.push([{ id: 'X', type: 'cashout', label: 'Cash-out', layer: hopDepth }])

  // Links: connect each node to 1–2 nodes in the next layer.
  const links = []
  for (let L = 0; L < layers.length - 1; L++) {
    const from = layers[L]
    const to = layers[L + 1]
    for (const src of from) {
      const outN = to.length === 1 ? 1 : clamp(Math.round(1 + rand() * (fanOut - 0.6)), 1, to.length)
      const targets = new Set()
      while (targets.size < outN) targets.add(to[Math.floor(rand() * to.length)].id)
      for (const t of targets) {
        const share = total / (from.length * outN) * (0.7 + rand() * 0.6)
        links.push({ source: src.id, target: t, amountK: Math.round(share / 1000), hop: L + 1 })
      }
    }
  }

  const nodes = layers.flat()
  return { nodes, links, layers, layerCount: layers.length }
}
