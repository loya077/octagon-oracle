import { describe, expect, it } from 'vitest'
import { parsePaste } from './paste'

const fighters = [
  { key: 'f1:A', name: 'Ciryl Gane' },
  { key: 'f2:A', name: 'Kayla Harrison' },
  { key: 'f4:A', name: 'Uroš Medić' },
  { key: 'f12:B', name: 'Alatengheili' },
  { key: 'f12:A', name: 'Juan Díaz' },
]

describe('parsePaste', () => {
  it('birth date fills all four values', () => {
    const [r] = parsePaste('Gane, 1980-04-07', fighters)
    expect(r).toMatchObject({ ok: true, key: 'f1:A', patch: { birth: '1980-04-07', bornDay: 7, lifePath: 11, pinnacle: 11, animal: 'Monkey' } })
  })
  it('keyword form', () => {
    const [r] = parsePaste('Harrison, born day 2, life path 9, pinnacle 11, Horse', fighters)
    expect(r).toMatchObject({ ok: true, key: 'f2:A', patch: { bornDay: 2, lifePath: 9, pinnacle: 11, animal: 'Horse' } })
  })
  it('positional form, accents ignored', () => {
    const [r] = parsePaste('Medic, 7, 33, 11, Rooster', fighters)
    expect(r).toMatchObject({ ok: true, key: 'f4:A', patch: { bornDay: 7, lifePath: 33, pinnacle: 11, animal: 'Rooster' } })
    const [d] = parsePaste('DIAZ, 3, 9, 3, Tiger', fighters)
    expect(d).toMatchObject({ ok: true, key: 'f12:A' })
  })
  it('single-name fighters and Rabbit alias', () => {
    const [r] = parsePaste('Alatengheili, 5, 1, 7, Rabbit', fighters)
    expect(r).toMatchObject({ ok: true, key: 'f12:B', patch: { animal: 'Cat' } })
  })
  it('reports unknown names and skips blank lines', () => {
    const res = parsePaste('\nJones, 1, 2, 3, Ox\n', fighters)
    expect(res).toHaveLength(1)
    expect(res[0].ok).toBe(false)
  })
})
