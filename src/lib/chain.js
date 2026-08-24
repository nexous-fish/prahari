// Append-only, hash-chained evidence register.
// Framed as "blockchain-anchored": each entry commits to the previous entry's
// hash, so any tampering breaks the chain. Uses a small synchronous FNV-based
// digest (demo integrity, not cryptographic security).

function fnv1a(str) {
  let h = 0x811c9dc5
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

// Mix into a 16-hex-char digest for a chain-like appearance.
export function digest(str) {
  const a = fnv1a(str)
  const b = fnv1a(str + '::' + a)
  return (a.toString(16).padStart(8, '0') + b.toString(16).padStart(8, '0'))
}

export const GENESIS = '0000000000000000'

export function chainEntry(prevHash, payload, ts) {
  const body = JSON.stringify({ prevHash, payload, ts })
  const hash = digest(body)
  return { prevHash, payload, ts, hash }
}

// Verify a chain: returns index of first broken link, or -1 if intact.
export function verifyChain(entries) {
  let prev = GENESIS
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i]
    if (e.prevHash !== prev) return i
    const body = JSON.stringify({ prevHash: e.prevHash, payload: e.payload, ts: e.ts })
    if (digest(body) !== e.hash) return i
    prev = e.hash
  }
  return -1
}
