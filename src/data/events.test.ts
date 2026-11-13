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
    ['Bilal Hasan', 'Luis Gurule', 93, 'Lock'],
    ['Terrance McKinney', 'Jim Miller', 91, 'Lock'],
    ['Ciryl Gane', 'Josh Hokit', 81, 'Lock'],
    ['Donte Johnson', 'César Almeida', 78, 'Strong'],
    ['Stephen Thompson', 'Charles Radtke', 74, 'Strong'],
    ['Chris Duncan', 'Drew Dober', 74, 'Strong'],
    ['Uroš Medić', 'Kevin Holland', 69, 'Strong'],
    ['Yousri Belgaroui', 'Caio Borralho', 63, 'Oracle upset'],
    ['Macy Chiasson', 'Bia Mesquita', 62, 'Oracle upset'],
    ['Juan Díaz', 'Alatengheili', 62, 'Lean (no line)'],
    ['Evan Elder', 'Samuel Sanches', 57, 'Oracle upset'],
    ['Kayla Harrison', 'Amanda Nunes', 54, 'Toss-up'],
    ['Melquizael Costa', 'Jared Gordon', 51, 'Toss-up'],
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
