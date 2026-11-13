import { describe, expect, it } from 'vitest'
import { summarize, upsert, type LedgerEntry } from './ledger'

const e = (id: string, upset: boolean, result: LedgerEntry['result']): LedgerEntry => ({
  id, eventId: 'x', eventName: 'X', fightId: id, pick: 'A', opponent: 'B', ml: -150,
  confidence: 0.6, readings: 'agree', upset, result, loggedAt: '',
})

describe('ledger', () => {
  it('summarizes overall, upset and market-agreeing records', () => {
    const s = summarize([e('1', false, 'hit'), e('2', false, 'miss'), e('3', true, 'hit'), e('4', true, null)])
    expect(s.all).toEqual({ hits: 2, misses: 1, rate: 2 / 3 })
    expect(s.upsets).toEqual({ hits: 1, misses: 0, rate: 1 })
    expect(s.market).toEqual({ hits: 1, misses: 1, rate: 0.5 })
    expect(s.pending).toBe(1)
  })
  it('upsert replaces pending entries but not graded ones', () => {
    const l = [e('1', false, null), e('2', false, 'hit')]
    expect(upsert(l, { ...e('1', true, null) })[0].upset).toBe(true)
    expect(upsert(l, { ...e('2', true, null) })[1].upset).toBe(false)
    expect(upsert(l, e('3', false, null))).toHaveLength(3)
  })
})
