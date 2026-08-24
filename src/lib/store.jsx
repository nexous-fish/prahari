import { createContext, useContext, useMemo, useReducer } from 'react'
import { predictLocations, buildMuleGraph, DEFAULT_WEIGHTS } from './predict.js'
import { chainEntry, GENESIS } from './chain.js'
import { SEED_COMPLAINTS, INGEST_QUEUE, ATM_BY_ID, categoryLabel } from './data.js'
import { riskTier, fmtINR } from './util.js'

const ROLES = {
  i4c: { key: 'i4c', name: 'I4C', org: 'Indian Cybercrime Coordination Centre', unit: 'National coordination cell', desc: 'Indian Cybercrime Coordination Centre · national coordination' },
  lea: { key: 'lea', name: 'LEA', org: 'Law Enforcement Agency', unit: 'Delhi Police · Cyber Cell', desc: 'Law Enforcement Agency · Delhi Police Cyber Cell' },
}
export { ROLES }

// --- session auth (prototype: sessionStorage, no backend) ---
const AUTH_KEY = 'prahari.role'
function readStoredRole() {
  try {
    const r = sessionStorage.getItem(AUTH_KEY)
    return r === 'i4c' || r === 'lea' ? r : null
  } catch { return null }
}

let uid = 0
const nextId = () => `${Date.now().toString(36)}-${(uid++).toString(36)}`

// --- build a case (+ its alerts + evidence) from a complaint through the pipeline ---
function createCase(complaint, weights, seq, createdAt) {
  const now = new Date(createdAt)
  const predictions = predictLocations(complaint, {
    weights,
    hour: now.getHours(),
    day: now.getDay(),
  })
  const graph = buildMuleGraph(complaint)
  const top = predictions[0]
  const caseId = `PWI-2026-${String(seq).padStart(4, '0')}`
  const tier = riskTier(top.score)

  const kase = {
    id: caseId,
    seq,
    complaint,
    createdAt,
    hour: now.getHours(),
    day: now.getDay(),
    predictions,
    graph,
    status: 'predicted',
    outcome: null,
    weightsAtPrediction: { ...weights },
  }

  const topBank = top.atm.bank
  const alerts = [
    {
      channel: 'LEA', level: tier.key, caseId,
      title: `Predicted cash-out · ${top.atm.area}`,
      body: `${categoryLabel(complaint.category)} · risk ${top.score.toFixed(2)} · window ETA ~${top.etaMins}m`,
    },
    {
      channel: 'BANK', level: tier.key, caseId, bank: topBank,
      title: `ATM flagged · ${top.atm.area}`,
      body: `${topBank} · ${top.atm.id} · risk ${top.score.toFixed(2)}`,
    },
  ].map((a) => ({ ...a, id: nextId(), ts: createdAt, read: false }))

  const evidence = [
    { type: 'COMPLAINT_FILED', caseId, actor: 'NCRP-API', summary: `Complaint registered · ${fmtINR(complaint.amount)} · ${categoryLabel(complaint.category)}` },
    { type: 'PREDICTION_RUN', caseId, actor: 'Praharī', summary: `Ranked ${predictions.length} locations · top ${top.atm.area} (${top.score.toFixed(2)})` },
    { type: 'ALERT_DISPATCHED', caseId, actor: 'Praharī', summary: `Alerts pushed → LEA, ${topBank}` },
  ]

  return { kase, alerts, evidence }
}

// --- reducer ---
function appendEvidence(chain, entries, baseTs) {
  let prev = chain.length ? chain[chain.length - 1].hash : GENESIS
  const added = entries.map((payload, i) => {
    const e = chainEntry(prev, payload, baseTs + i)
    prev = e.hash
    return e
  })
  return [...chain, ...added]
}

// Nudge weights toward/away from a factor, renormalize to sum 1.
function nudge(weights, factorKey, dir, mag = 0.05) {
  const w = { ...weights }
  w[factorKey] = Math.max(0.05, Math.min(0.6, w[factorKey] + dir * mag))
  const sum = Object.values(w).reduce((a, b) => a + b, 0)
  for (const k in w) w[k] = +(w[k] / sum).toFixed(3)
  // fix rounding drift on the largest key
  const drift = +(1 - Object.values(w).reduce((a, b) => a + b, 0)).toFixed(3)
  if (drift) {
    const big = Object.entries(w).sort((a, b) => b[1] - a[1])[0][0]
    w[big] = +(w[big] + drift).toFixed(3)
  }
  return w
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_ROLE':
      return { ...state, role: action.role }

    case 'INGEST_COMPLAINT': {
      const complaint = INGEST_QUEUE[state.ingestIdx % INGEST_QUEUE.length]
      const seq = state.seq + 1
      const { kase, alerts, evidence } = createCase(complaint, state.weights, seq, action.ts)
      const toasts = alerts.map((a) => ({ ...a, id: nextId() }))
      return {
        ...state,
        seq,
        ingestIdx: state.ingestIdx + 1,
        cases: [kase, ...state.cases],
        alerts: [...alerts, ...state.alerts],
        toasts: [...state.toasts, ...toasts],
        evidence: appendEvidence(state.evidence, evidence, action.ts),
      }
    }

    case 'CASE_ACTION': {
      const { caseId, status, actor, summary, level } = action
      const cases = state.cases.map((c) => (c.id === caseId ? { ...c, status } : c))
      const toast = {
        id: nextId(), channel: actor, level: level || 'watch',
        title: action.title, body: summary, ts: action.ts,
      }
      return {
        ...state,
        cases,
        toasts: [...state.toasts, toast],
        evidence: appendEvidence(state.evidence, [{ type: action.evType, caseId, actor, summary }], action.ts),
      }
    }

    case 'SET_WEIGHTS': {
      const entry = { ts: action.ts, weights: action.weights, reason: action.reason }
      return {
        ...state,
        weights: action.weights,
        weightHistory: [...state.weightHistory, entry],
        evidence: appendEvidence(state.evidence, [
          { type: 'WEIGHTS_UPDATED', caseId: action.caseId || '-', actor: action.actor || 'I4C', summary: action.reason },
        ], action.ts),
      }
    }

    case 'LOG_OUTCOME': {
      const { caseId, result, atmId, note, ts } = action
      const kase = state.cases.find((c) => c.id === caseId)
      const pred = kase?.predictions.find((p) => p.atm.id === atmId) || kase?.predictions[0]
      const factor = pred?.topFactor || 'graph'
      const statusMap = { intercepted: 'intercepted', missed: 'missed', false_positive: 'false_positive' }
      const cases = state.cases.map((c) =>
        c.id === caseId ? { ...c, status: statusMap[result], outcome: { result, atmId, note, ts } } : c
      )

      // Feedback loop: reinforce the decisive factor on a hit, dampen on a miss / FP.
      const dir = result === 'intercepted' ? +1 : -1
      const newWeights = nudge(state.weights, factor, dir, 0.05)
      const reason =
        result === 'intercepted'
          ? `Intercepted at ${ATM_BY_ID[atmId]?.area || atmId} → reinforced ${factor} weight`
          : result === 'false_positive'
          ? `False positive at ${ATM_BY_ID[atmId]?.area || atmId} → dampened ${factor} weight`
          : `Missed at ${ATM_BY_ID[atmId]?.area || atmId} → dampened ${factor} weight`

      const evidence = appendEvidence(state.evidence, [
        { type: 'OUTCOME_LOGGED', caseId, actor: 'LEA', summary: `${result.replace('_', ' ')} · ${ATM_BY_ID[atmId]?.area || atmId}${note ? ' · ' + note : ''}` },
        { type: 'WEIGHTS_UPDATED', caseId, actor: 'Praharī (auto)', summary: reason },
      ], ts)

      const toast = {
        id: nextId(), channel: 'MODEL', level: result === 'intercepted' ? 'watch' : 'elevated',
        title: 'Model updated', body: reason, ts,
      }

      return {
        ...state,
        cases,
        weights: newWeights,
        weightHistory: [...state.weightHistory, { ts, weights: newWeights, reason }],
        evidence,
        toasts: [...state.toasts, toast],
      }
    }

    case 'MARK_READ':
      return { ...state, alerts: state.alerts.map((a) => ({ ...a, read: true })) }

    case 'DISMISS_TOAST':
      return { ...state, toasts: state.toasts.filter((t) => t.id !== action.id) }

    default:
      return state
  }
}

// --- seed initial state (2 active cases through the pipeline) ---
function makeInitialState() {
  let state = {
    role: readStoredRole(),
    weights: { ...DEFAULT_WEIGHTS },
    weightHistory: [{ ts: Date.now() - 3 * 864e5, weights: { ...DEFAULT_WEIGHTS }, reason: 'Baseline weights initialised' }],
    seq: 0,
    ingestIdx: 0,
    cases: [],
    alerts: [],
    toasts: [],
    evidence: [],
  }
  SEED_COMPLAINTS.forEach((c) => {
    const ts = Date.now() - (c.filedAgoMins || 30) * 60000
    const seq = state.seq + 1
    const { kase, alerts, evidence } = createCase(c, state.weights, seq, ts)
    state = {
      ...state,
      seq,
      cases: [kase, ...state.cases],
      alerts: [...alerts.map((a) => ({ ...a, read: true })), ...state.alerts],
      evidence: appendEvidence(state.evidence, evidence, ts),
    }
  })
  return state
}

const AppCtx = createContext(null)

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, makeInitialState)

  const actions = useMemo(
    () => ({
      login: (role) => {
        try { sessionStorage.setItem(AUTH_KEY, role) } catch { /* ignore */ }
        dispatch({ type: 'SET_ROLE', role })
      },
      logout: () => {
        try { sessionStorage.removeItem(AUTH_KEY) } catch { /* ignore */ }
        dispatch({ type: 'SET_ROLE', role: null })
      },
      ingestComplaint: () => {
        const ts = Date.now()
        dispatch({ type: 'INGEST_COMPLAINT', ts })
        return `PWI-2026-${String(state.seq + 1).padStart(4, '0')}`
      },
      caseAction: (payload) => dispatch({ type: 'CASE_ACTION', ts: Date.now(), ...payload }),
      setWeights: (weights, reason, opts = {}) =>
        dispatch({ type: 'SET_WEIGHTS', weights, reason, ts: Date.now(), ...opts }),
      logOutcome: (payload) => dispatch({ type: 'LOG_OUTCOME', ts: Date.now(), ...payload }),
      markRead: () => dispatch({ type: 'MARK_READ' }),
      dismissToast: (id) => dispatch({ type: 'DISMISS_TOAST', id }),
    }),
    [state.seq]
  )

  const value = useMemo(() => ({ ...state, ...actions }), [state, actions])
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>
}

export function useApp() {
  const ctx = useContext(AppCtx)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
