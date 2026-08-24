// Synthetic dataset for the demo. No real bank data; all generated.
// Grounded in Delhi NCR so place names read as real to judges.

import { mulberry32, haversineKm } from './util.js'

export const FRAUD_CATEGORIES = [
  { id: 'upi', label: 'UPI / wallet fraud' },
  { id: 'card', label: 'Card-not-present fraud' },
  { id: 'impersonation', label: 'Digital arrest / impersonation' },
  { id: 'investment', label: 'Investment / trading scam' },
  { id: 'job', label: 'Job / task-based scam' },
  { id: 'loan', label: 'Instant-loan app fraud' },
]

export const BANKS = [
  'State Bank of India',
  'Punjab National Bank',
  'HDFC Bank',
  'ICICI Bank',
  'Axis Bank',
  'Bank of Baroda',
  'Kotak Mahindra Bank',
  'Canara Bank',
]

export const JURISDICTIONS = [
  'Central Delhi',
  'North Delhi',
  'South Delhi',
  'East Delhi',
  'West Delhi',
  'Outer Delhi',
  'Shahdara',
  'Gautam Buddh Nagar',
  'Gurugram',
  'Faridabad',
]

// Candidate cash-out points (ATMs / cash agents), color-coded later by risk.
export const ATMS = [
  { id: 'ATM-KB-04', area: 'Karol Bagh',        lat: 28.6512, lng: 77.1907, bank: 'Punjab National Bank',   jur: 'Central Delhi' },
  { id: 'ATM-PG-11', area: 'Paharganj',         lat: 28.6448, lng: 77.2140, bank: 'State Bank of India',    jur: 'Central Delhi' },
  { id: 'ATM-CP-02', area: 'Connaught Place',   lat: 28.6315, lng: 77.2167, bank: 'HDFC Bank',              jur: 'Central Delhi' },
  { id: 'ATM-CC-07', area: 'Chandni Chowk',     lat: 28.6506, lng: 77.2303, bank: 'Bank of Baroda',         jur: 'North Delhi' },
  { id: 'ATM-SB-09', area: 'Sadar Bazar',       lat: 28.6610, lng: 77.2160, bank: 'Punjab National Bank',   jur: 'North Delhi' },
  { id: 'ATM-SB-14', area: 'Sadar Bazar West',  lat: 28.6635, lng: 77.2098, bank: 'Canara Bank',            jur: 'North Delhi' },
  { id: 'ATM-NK-05', area: 'Nabi Karim',        lat: 28.6472, lng: 77.2088, bank: 'State Bank of India',    jur: 'Central Delhi' },
  { id: 'ATM-LN-03', area: 'Lajpat Nagar',      lat: 28.5677, lng: 77.2433, bank: 'ICICI Bank',             jur: 'South Delhi' },
  { id: 'ATM-NP-08', area: 'Nehru Place',       lat: 28.5491, lng: 77.2533, bank: 'Axis Bank',              jur: 'South Delhi' },
  { id: 'ATM-KJ-01', area: 'Kalkaji',           lat: 28.5490, lng: 77.2590, bank: 'Kotak Mahindra Bank',    jur: 'South Delhi' },
  { id: 'ATM-LX-06', area: 'Laxmi Nagar',       lat: 28.6304, lng: 77.2770, bank: 'HDFC Bank',              jur: 'East Delhi' },
  { id: 'ATM-PV-12', area: 'Preet Vihar',       lat: 28.6410, lng: 77.2955, bank: 'State Bank of India',    jur: 'East Delhi' },
  { id: 'ATM-RH-07', area: 'Rohini Sector 7',   lat: 28.7050, lng: 77.1170, bank: 'Punjab National Bank',   jur: 'Outer Delhi' },
  { id: 'ATM-RH-03', area: 'Rohini Sector 3',   lat: 28.7180, lng: 77.1050, bank: 'Bank of Baroda',         jur: 'Outer Delhi' },
  { id: 'ATM-PP-10', area: 'Pitampura',         lat: 28.6980, lng: 77.1310, bank: 'Axis Bank',              jur: 'Outer Delhi' },
  { id: 'ATM-DW-06', area: 'Dwarka Sector 6',   lat: 28.5920, lng: 77.0460, bank: 'ICICI Bank',             jur: 'West Delhi' },
  { id: 'ATM-DM-02', area: 'Dwarka Mor',        lat: 28.6190, lng: 77.0330, bank: 'State Bank of India',    jur: 'West Delhi' },
  { id: 'ATM-JP-05', area: 'Janakpuri',         lat: 28.6215, lng: 77.0855, bank: 'Canara Bank',            jur: 'West Delhi' },
  { id: 'ATM-RG-08', area: 'Rajouri Garden',    lat: 28.6490, lng: 77.1210, bank: 'HDFC Bank',              jur: 'West Delhi' },
  { id: 'ATM-UN-04', area: 'Uttam Nagar',       lat: 28.6220, lng: 77.0560, bank: 'Kotak Mahindra Bank',    jur: 'West Delhi' },
  { id: 'ATM-SH-09', area: 'Shahdara',          lat: 28.6730, lng: 77.2890, bank: 'Punjab National Bank',   jur: 'Shahdara' },
  { id: 'ATM-SP-03', area: 'Seelampur',         lat: 28.6700, lng: 77.2670, bank: 'State Bank of India',    jur: 'Shahdara' },
  { id: 'ATM-ND-18', area: 'Noida Sector 18',   lat: 28.5700, lng: 77.3210, bank: 'Axis Bank',              jur: 'Gautam Buddh Nagar' },
  { id: 'ATM-ND-62', area: 'Noida Sector 62',   lat: 28.6270, lng: 77.3650, bank: 'ICICI Bank',             jur: 'Gautam Buddh Nagar' },
  { id: 'ATM-GG-21', area: 'Gurugram Cyber Hub',lat: 28.4950, lng: 77.0890, bank: 'HDFC Bank',              jur: 'Gurugram' },
  { id: 'ATM-FB-07', area: 'Faridabad NIT',     lat: 28.3870, lng: 77.3050, bank: 'Bank of Baroda',         jur: 'Faridabad' },
]

// "Hot" corridors: historical mule cash-out tends to cluster in dense
// cash markets. Withdrawal history is generated around these anchors.
const HOT_ANCHORS = [
  { lat: 28.6512, lng: 77.1907, weight: 34 }, // Karol Bagh
  { lat: 28.6610, lng: 77.2160, weight: 30 }, // Sadar Bazar
  { lat: 28.6448, lng: 77.2140, weight: 26 }, // Paharganj
  { lat: 28.5677, lng: 77.2433, weight: 20 }, // Lajpat Nagar
  { lat: 28.6304, lng: 77.2770, weight: 16 }, // Laxmi Nagar
  { lat: 28.7050, lng: 77.1170, weight: 12 }, // Rohini
  { lat: 28.6730, lng: 77.2890, weight: 12 }, // Shahdara
]

// Generate ~190 historical withdrawal points deterministically.
export const WITHDRAWAL_HISTORY = (() => {
  const rng = mulberry32(26184)
  const points = []
  const catIds = FRAUD_CATEGORIES.map((c) => c.id)
  for (const anchor of HOT_ANCHORS) {
    for (let i = 0; i < anchor.weight; i++) {
      // tight Gaussian-ish scatter around anchor (~0.4–1.2 km)
      const spread = 0.006 + rng() * 0.012
      const lat = anchor.lat + (rng() - 0.5) * spread * 2
      const lng = anchor.lng + (rng() - 0.5) * spread * 2
      // withdrawals skew to daytime cash hours; bimodal 11–14 and 17–20
      const bucket = rng()
      let hour
      if (bucket < 0.5) hour = 11 + Math.floor(rng() * 4)
      else if (bucket < 0.85) hour = 17 + Math.floor(rng() * 4)
      else hour = Math.floor(rng() * 24)
      const day = Math.floor(rng() * 7)
      const amountK = 20 + Math.floor(rng() * 90) // ₹20k–110k per hit
      points.push({
        lat, lng, hour, day, amountK,
        category: catIds[Math.floor(rng() * catIds.length)],
      })
    }
  }
  return points
})()

// Historically flagged cases with their mule-chain structural signature and
// the ATM zone where the money was actually withdrawn. Used to score how
// closely a NEW complaint's chain resembles a solved one (GraphSimilarity).
// signature features: hopDepth, muleCount, fanOut, avgHopAmountK, speedMins
export const PAST_CASES = [
  { id: 'HC-2314', category: 'investment',     sig: { hopDepth: 5, muleCount: 9, fanOut: 2.1, avgHopAmountK: 180, speedMins: 22 }, cashOut: { area: 'Karol Bagh',     lat: 28.6520, lng: 77.1899 }, recovered: false },
  { id: 'HC-2288', category: 'investment',     sig: { hopDepth: 4, muleCount: 7, fanOut: 1.9, avgHopAmountK: 140, speedMins: 31 }, cashOut: { area: 'Sadar Bazar',    lat: 28.6605, lng: 77.2151 }, recovered: true },
  { id: 'HC-2401', category: 'impersonation',  sig: { hopDepth: 3, muleCount: 4, fanOut: 1.4, avgHopAmountK: 320, speedMins: 14 }, cashOut: { area: 'Paharganj',      lat: 28.6451, lng: 77.2133 }, recovered: false },
  { id: 'HC-2377', category: 'impersonation',  sig: { hopDepth: 3, muleCount: 5, fanOut: 1.6, avgHopAmountK: 260, speedMins: 18 }, cashOut: { area: 'Karol Bagh',     lat: 28.6499, lng: 77.1921 }, recovered: false },
  { id: 'HC-2190', category: 'upi',            sig: { hopDepth: 6, muleCount: 12, fanOut: 2.8, avgHopAmountK: 45, speedMins: 9 },  cashOut: { area: 'Laxmi Nagar',    lat: 28.6309, lng: 77.2765 }, recovered: true },
  { id: 'HC-2255', category: 'upi',            sig: { hopDepth: 5, muleCount: 10, fanOut: 2.5, avgHopAmountK: 60, speedMins: 12 }, cashOut: { area: 'Shahdara',       lat: 28.6728, lng: 77.2884 }, recovered: false },
  { id: 'HC-2333', category: 'job',            sig: { hopDepth: 4, muleCount: 6, fanOut: 2.0, avgHopAmountK: 55, speedMins: 20 },  cashOut: { area: 'Lajpat Nagar',   lat: 28.5680, lng: 77.2428 }, recovered: false },
  { id: 'HC-2412', category: 'loan',           sig: { hopDepth: 3, muleCount: 4, fanOut: 1.5, avgHopAmountK: 38, speedMins: 25 },  cashOut: { area: 'Rohini Sector 7',lat: 28.7048, lng: 77.1165 }, recovered: true },
  { id: 'HC-2201', category: 'card',           sig: { hopDepth: 2, muleCount: 3, fanOut: 1.2, avgHopAmountK: 90, speedMins: 40 },  cashOut: { area: 'Nehru Place',    lat: 28.5495, lng: 77.2528 }, recovered: false },
  { id: 'HC-2360', category: 'investment',     sig: { hopDepth: 5, muleCount: 8, fanOut: 2.2, avgHopAmountK: 210, speedMins: 26 }, cashOut: { area: 'Sadar Bazar',    lat: 28.6620, lng: 77.2142 }, recovered: false },
]

// A couple of pre-seeded active cases so dashboards aren't empty on first load.
// (These are hydrated through the same prediction pipeline in the store.)
export const SEED_COMPLAINTS = [
  {
    victimName: 'Ramesh Gupta',
    victimPhone: '98•••••210',
    accountNo: '••••••••4471',
    bank: 'HDFC Bank',
    ifsc: 'HDFC0001234',
    amount: 1850000,
    category: 'investment',
    lastKnown: { area: 'Rohini Sector 3', lat: 28.7180, lng: 77.1050 },
    sig: { hopDepth: 5, muleCount: 9, fanOut: 2.1, avgHopAmountK: 190, speedMins: 21 },
    filedAgoMins: 46,
  },
  {
    victimName: 'S. Fernandes',
    victimPhone: '99•••••884',
    accountNo: '••••••••9032',
    bank: 'ICICI Bank',
    ifsc: 'ICIC0004521',
    amount: 640000,
    category: 'impersonation',
    lastKnown: { area: 'Connaught Place', lat: 28.6315, lng: 77.2167 },
    sig: { hopDepth: 3, muleCount: 5, fanOut: 1.5, avgHopAmountK: 250, speedMins: 16 },
    filedAgoMins: 12,
  },
]

// Complaints waiting in the NCRP ingestion queue. The prototype does not
// re-file complaints (citizens do that on the NCRP portal); it *ingests* them
// via API. This pool lets the demo pull the "next" incoming complaint and run
// it through the pipeline live, producing a fresh prediction + real-time alerts.
export const INGEST_QUEUE = [
  {
    victimName: 'P. Nair', victimPhone: '98•••••317', accountNo: '••••••••2210',
    bank: 'Axis Bank', ifsc: 'UTIB0000456', amount: 320000, category: 'upi',
    lastKnown: { area: 'Uttam Nagar', lat: 28.6220, lng: 77.0560 },
    sig: { hopDepth: 6, muleCount: 12, fanOut: 2.6, avgHopAmountK: 27, speedMins: 10 },
  },
  {
    victimName: 'R. Deshmukh', victimPhone: '97•••••045', accountNo: '••••••••8837',
    bank: 'State Bank of India', ifsc: 'SBIN0007712', amount: 2400000, category: 'impersonation',
    lastKnown: { area: 'Dwarka Sector 6', lat: 28.5920, lng: 77.0460 },
    sig: { hopDepth: 3, muleCount: 5, fanOut: 1.5, avgHopAmountK: 480, speedMins: 16 },
  },
  {
    victimName: 'K. Iyer', victimPhone: '90•••••662', accountNo: '••••••••1904',
    bank: 'Kotak Mahindra Bank', ifsc: 'KKBK0003390', amount: 180000, category: 'job',
    lastKnown: { area: 'Noida Sector 62', lat: 28.6270, lng: 77.3650 },
    sig: { hopDepth: 4, muleCount: 8, fanOut: 2.0, avgHopAmountK: 22, speedMins: 20 },
  },
  {
    victimName: 'A. Khanna', victimPhone: '99•••••128', accountNo: '••••••••5567',
    bank: 'HDFC Bank', ifsc: 'HDFC0002201', amount: 1250000, category: 'investment',
    lastKnown: { area: 'Preet Vihar', lat: 28.6410, lng: 77.2955 },
    sig: { hopDepth: 5, muleCount: 10, fanOut: 2.1, avgHopAmountK: 125, speedMins: 26 },
  },
  {
    victimName: 'M. Bose', victimPhone: '81•••••490', accountNo: '••••••••7723',
    bank: 'ICICI Bank', ifsc: 'ICIC0006654', amount: 90000, category: 'loan',
    lastKnown: { area: 'Gurugram Cyber Hub', lat: 28.4950, lng: 77.0890 },
    sig: { hopDepth: 3, muleCount: 5, fanOut: 1.5, avgHopAmountK: 18, speedMins: 24 },
  },
  {
    victimName: 'T. Rao', victimPhone: '96•••••203', accountNo: '••••••••3341',
    bank: 'Punjab National Bank', ifsc: 'PUNB0451000', amount: 540000, category: 'card',
    lastKnown: { area: 'Pitampura', lat: 28.6980, lng: 77.1310 },
    sig: { hopDepth: 2, muleCount: 3, fanOut: 1.3, avgHopAmountK: 180, speedMins: 38 },
  },
]

// Convenience lookups
export const ATM_BY_ID = Object.fromEntries(ATMS.map((a) => [a.id, a]))
export function categoryLabel(id) {
  return FRAUD_CATEGORIES.find((c) => c.id === id)?.label || id
}

// Count of historical points near a coordinate (used in a few UI stats).
export function historyNear(point, radiusKm = 1.5) {
  return WITHDRAWAL_HISTORY.filter((p) => haversineKm(p, point) <= radiusKm).length
}
