import { describe, expect, it } from 'vitest'
import { animalForDate, animalOfYear, animalRel, lunarNewYear, lunarYear, normalizeAnimal } from './astrology'

describe('animalRel', () => {
  it('matches the acceptance values', () => {
    expect(animalRel('Rat', 'Horse')).toEqual(['enemies', -3])
    expect(animalRel('Tiger', 'Horse')).toEqual(['trine', 3])
    expect(animalRel('Rat', 'Ox')).toEqual(['soulmates', 4])
  })
  it('enemies are six apart', () => {
    for (const [a, b] of [['Ox', 'Goat'], ['Tiger', 'Monkey'], ['Cat', 'Rooster'], ['Dragon', 'Dog'], ['Snake', 'Pig']]) {
      expect(animalRel(a, b)[1]).toBe(-3)
      expect(animalRel(b, a)[1]).toBe(-3)
    }
  })
  it('trines', () => {
    expect(animalRel('Rat', 'Dragon')[1]).toBe(3)
    expect(animalRel('Monkey', 'Rat')[1]).toBe(3)
    expect(animalRel('Cat', 'Pig')[1]).toBe(3)
    expect(animalRel('Ox', 'Rooster')[1]).toBe(3)
  })
  it('same sign and neutral are 0', () => {
    expect(animalRel('Horse', 'Horse')).toEqual(['same sign', 0])
    expect(animalRel('Ox', 'Horse')).toEqual(['neutral', 0])
  })
  it('accepts Rabbit and Sheep', () => {
    expect(normalizeAnimal('Rabbit')).toBe('Cat')
    expect(normalizeAnimal('sheep')).toBe('Goat')
    expect(animalRel('Rabbit', 'Rooster')[1]).toBe(-3)
    expect(animalRel('Sheep', 'Ox')[1]).toBe(-3)
  })
})

describe('lunar year', () => {
  it('uses the Lunar New Year table', () => {
    expect(lunarNewYear(2026)).toEqual({ m: 2, d: 17 })
    expect(lunarNewYear(1980)).toEqual({ m: 2, d: 16 })
  })
  it('dates before LNY belong to the previous year', () => {
    expect(lunarYear(1980, 2, 15)).toBe(1979)
    expect(lunarYear(1980, 2, 16)).toBe(1980)
    expect(animalForDate('1980-02-15')).toBe('Goat')
    expect(animalForDate('1980-02-16')).toBe('Monkey')
  })
  it('maps years to animals', () => {
    expect(animalOfYear(2020)).toBe('Rat')
    expect(animalOfYear(2026)).toBe('Horse')
    expect(animalOfYear(1983)).toBe('Pig')
  })
})
