import { describe, expect, it } from 'vitest'
import ev from './events/ufc-334.json'
import type { EventData } from './events'
import { buildVerdict } from '../model/verdict'
import { DEFAULT_SETTINGS } from '../model/predict'

const event = ev as EventData

describe('UFC 334 data', () => {
  it('has 13 fights and 26 fighters with readings', () => {
    expect(event.fights).toHaveLength(13)
    const fighters = event.fights.flatMap((f) => [f.a, f.b])
    expect(fighters).toHaveLength(26)
    for (const f of fighters) {
      expect(f.reading.bornDay).toBeGreaterThan(0)
      expect(f.reading.animal).toBeTruthy()
    }
  })
})

describe('acceptance: verdict at default settings', () => {
  const expected: Array<[string, string, number, string]> = [
    // Pinnacle counts only on an exact match with the fight life path (8) or day (5);
    // master pinnacles get no edge. A fighter whose animal matches the year (Horse) gets +4.
    ['Bilal Hasan', 'Luis Gurule', 96, 'Lock'],
    ['Ciryl Gane', 'Josh Hokit', 86, 'Lock'],
    ['Kayla Harrison', 'Amanda Nunes', 80, 'Lock'],
    ['Yousri Belgaroui', 'Caio Borralho', 75, 'Oracle upset'],
    ['Terrance McKinney', 'Jim Miller', 73, 'Strong'],
    ['Donte Johnson', 'César Almeida', 73, 'Strong'],
    ['Chris Duncan', 'Drew Dober', 68, 'Strong'],
    ['Evan Elder', 'Samuel Sanches', 68, 'Oracle upset'],
    ['Stephen Thompson', 'Charles Radtke', 59, 'Lean'],
    ['Bia Mesquita', 'Macy Chiasson', 59, 'Lean'],
    ['Melquizael Costa', 'Jared Gordon', 58, 'Lean'],
    ['Uroš Medić', 'Kevin Holland', 56, 'Lean'],
    ['Juan Díaz', 'Alatengheili', 51, 'Toss-up (no line)'],
  ]
  const rows = buildVerdict(event.fights, event.date, DEFAULT_SETTINGS)

  it.each(expected.map((e, i) => [i + 1, ...e] as const))('#%i %s over %s, %i%%, %s', (rank, win, lose, pct, call) => {
    const r = rows[rank - 1]
    expect(r.winner.name).toBe(win)
    expect(r.loser.name).toBe(lose)
    expect(Math.round(r.pred.confidence * 100)).toBe(pct)
    const label = r.pred.upset ? 'Oracle upset' : r.pred.hasLine ? r.pred.tier : `${r.pred.tier} (no line)`
    expect(label).toBe(call)
  })
})

describe('acceptance: influence 0 follows the market', () => {
  it('every pick is the betting favorite; Díaz on the no-line tie', () => {
    const rows = buildVerdict(event.fights, event.date, { ...DEFAULT_SETTINGS, influence: 0 })
    for (const r of rows) {
      expect(r.pred.upset).toBe(false)
      if (r.pred.hasLine) {
        expect(r.winner.ml!).toBeLessThan(r.loser.ml!)
      } else {
        expect(r.pred.p).toBe(0.5)
        expect(r.winner.name).toBe('Juan Díaz')
      }
    }
  })
})
