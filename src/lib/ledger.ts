import type { Agreement, Analysis } from './view'

export interface LedgerEntry {
  id: string
  eventId: string
  eventName: string
  fightId: string
  pick: string
  opponent: string
  ml: number | null
  confidence: number
  readings: Agreement
  upset: boolean
  result: 'hit' | 'miss' | null
  loggedAt: string
}

export function entryFor(an: Analysis, eventId: string, eventName: string, readings: Agreement): LedgerEntry {
  return {
    id: `${eventId}:${an.fight.id}`,
    eventId, eventName,
    fightId: an.fight.id,
    pick: an.winner.name,
    opponent: an.loser.name,
    ml: an.winner.ml,
    confidence: an.pred.confidence,
    readings,
    upset: an.pred.upset,
    result: null,
    loggedAt: new Date().toISOString(),
  }
}

/** Add or refresh an entry. Graded entries are left alone. */
export function upsert(ledger: LedgerEntry[], e: LedgerEntry): LedgerEntry[] {
  const i = ledger.findIndex((x) => x.id === e.id)
  if (i < 0) return [...ledger, e]
  if (ledger[i].result) return ledger
  const next = ledger.slice()
  next[i] = e
  return next
}

export interface Record3 { hits: number; misses: number; rate: number | null }

function rec(list: LedgerEntry[]): Record3 {
  const hits = list.filter((x) => x.result === 'hit').length
  const misses = list.filter((x) => x.result === 'miss').length
  return { hits, misses, rate: hits + misses ? hits / (hits + misses) : null }
}

export function summarize(ledger: LedgerEntry[]) {
  return {
    all: rec(ledger),
    upsets: rec(ledger.filter((x) => x.upset)),
    market: rec(ledger.filter((x) => !x.upset)),
    pending: ledger.filter((x) => !x.result).length,
  }
}
