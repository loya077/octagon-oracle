import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS, fightContext, fromBirth, predict, scoreReading, tierFor } from './predict'

const ctx = fightContext('2026-11-14')

describe('fromBirth', () => {
  it('matches the acceptance value', () => {
    expect(fromBirth('1980-04-07')).toEqual({ bornDay: 7, lifePath: 11, pinnacle: 11, animal: 'Monkey' })
  })
  it('rejects bad input', () => {
    expect(fromBirth('1980-13-01')).toBeNull()
  })
})

describe('fightContext', () => {
  it('UFC 334 is life path 8, day 5, Horse', () => {
    expect(ctx).toEqual({ lifePath: 8, day: 5, animal: 'Horse' })
  })
})

describe('scoreReading', () => {
  it('Gane: 8 rows and the expected totals', () => {
    const s = scoreReading({ bornDay: 3, lifePath: 8, pinnacle: 22, animal: 'Horse' }, ctx)!
    expect(s.rows).toHaveLength(8)
    // pinnacle 22: no match with 8 or 5 → 0, 0 (pinnacle counts only on a match)
    // life path 8: vs 8 match +3×2, vs 5 friendly +2×2
    // born day 3: vs 8 neutral, vs 5 neutral; master: pinnacle gets no edge → 0
    expect(s.rows.map((r) => r.points)).toEqual([0, 0, 6, 4, 0, 0, 0, 0])
    expect(s.rows[0].note).toBe('22 vs 8: no match (counts only on a match)')
    expect(s.rows[6].note).toBe('none')
    expect(s.num).toBe(10)
    expect(s.astro).toBe(0)
    expect(s.total).toBeCloseTo((7.5 * 10) / 48 * 2, 10)
  })
  it('pinnacle scores +9 for each exact match with the fight life path or day', () => {
    // Holland: pinnacle 8 matches fight life path 8
    const holland = scoreReading({ bornDay: 5, lifePath: 1, pinnacle: 8, animal: 'Monkey' }, ctx)!
    expect(holland.rows[0].points).toBe(9)
    expect(holland.rows[0].rel).toBe('match')
    expect(holland.rows[1].points).toBe(0)
    // Belgaroui: pinnacle 5 matches fight day 5
    const belgaroui = scoreReading({ bornDay: 2, lifePath: 11, pinnacle: 5, animal: 'Monkey' }, ctx)!
    expect(belgaroui.rows[0].points).toBe(0)
    expect(belgaroui.rows[1].points).toBe(9)
    // Enemy or friendly pinnacles score nothing: 4 vs 5 would be enemies, 2 vs 8 friendly
    expect(scoreReading({ bornDay: 2, lifePath: 2, pinnacle: 4, animal: 'Ox' }, ctx)!.rows[1].points).toBe(0)
    expect(scoreReading({ bornDay: 2, lifePath: 2, pinnacle: 2, animal: 'Ox' }, ctx)!.rows[0].points).toBe(0)
  })
  it('master edge scales the master row', () => {
    const r = { bornDay: 11, lifePath: 33, pinnacle: 22, animal: 'Ox' }
    const full = scoreReading(r, ctx)!
    const half = scoreReading(r, ctx, { ...DEFAULT_SETTINGS, masterEdge: 50 })!
    // life path 33 (+8) + born day 11 (+6); the master pinnacle 22 adds nothing
    expect(full.rows[6].points).toBe(14)
    expect(full.rows[6].note).toBe('life path 33, born day 11')
    expect(half.rows[6].points).toBe(7)
    const third = scoreReading(r, ctx, { ...DEFAULT_SETTINGS, masterEdge: 33 })!
    expect(third.rows[6].points).toBe(4.6)
  })
  it('missing values → null', () => {
    expect(scoreReading({ bornDay: 3, lifePath: null, pinnacle: 22, animal: 'Horse' }, ctx)).toBeNull()
    expect(scoreReading({ bornDay: 3, lifePath: 8, pinnacle: 22, animal: '' }, ctx)).toBeNull()
    expect(scoreReading(null, ctx)).toBeNull()
  })
})

describe('tierFor', () => {
  it('uses whole-percent cutoffs', () => {
    expect(tierFor(0.8)).toBe('Lock')
    expect(tierFor(0.7968)).toBe('Lock') // displays as 80%
    expect(tierFor(0.79)).toBe('Strong')
    expect(tierFor(0.65)).toBe('Strong')
    expect(tierFor(0.64)).toBe('Lean')
    expect(tierFor(0.55)).toBe('Lean')
    expect(tierFor(0.54)).toBe('Toss-up')
  })
})

describe('predict', () => {
  const gane = { bornDay: 3, lifePath: 8, pinnacle: 22, animal: 'Horse' }
  const hokit = { bornDay: 3, lifePath: 4, pinnacle: 11, animal: 'Ox' }
  it('influence 0 is the market', () => {
    const p = predict({ mlA: -225, mlB: 185, readingA: gane, readingB: hokit }, ctx, { ...DEFAULT_SETTINGS, influence: 0 })
    expect(p.p).toBeCloseTo(p.pMarket, 12)
    expect(p.upset).toBe(false)
  })
  it('readings are ignored unless both fighters have them', () => {
    const p = predict({ mlA: -225, mlB: 185, readingA: gane, readingB: null }, ctx)
    expect(p.oDiff).toBe(0)
    expect(p.hasReadings).toBe(false)
    expect(p.p).toBeCloseTo(p.pMarket, 12)
  })
  it('no line + exact tie picks by readings lean', () => {
    const p = predict({ mlA: null, mlB: null, readingA: hokit, readingB: gane }, ctx, { ...DEFAULT_SETTINGS, influence: 0 })
    expect(p.p).toBe(0.5)
    expect(p.pick).toBe('B')
    expect(p.upset).toBe(false)
  })
  it('no line, no readings → A', () => {
    const p = predict({ mlA: null, mlB: null, readingA: null, readingB: null }, ctx)
    expect(p.pick).toBe('A')
  })
  it('pRead is sigmoid(oDiff / 2.5)', () => {
    const p = predict({ mlA: -225, mlB: 185, readingA: gane, readingB: hokit }, ctx)
    expect(p.pRead).toBeCloseTo(1 / (1 + Math.exp(-p.oDiff / 2.5)), 12)
  })
})
