import { describe, expect, it } from 'vitest'
import { digitSum, firstPinnacle, isMaster, lifePath, numRel, parseDate, reduce } from './numerology'

describe('digitSum', () => {
  it('sums digits of numbers and date strings', () => {
    expect(digitSum(0)).toBe(0)
    expect(digitSum(1980)).toBe(18)
    expect(digitSum('1980-04-07')).toBe(29)
    expect(digitSum('2026-11-14')).toBe(17)
  })
  it('ignores non-digits', () => {
    expect(digitSum('a1b2c3')).toBe(6)
  })
})

describe('reduce', () => {
  it('matches the acceptance values', () => {
    expect(reduce(20)).toBe(11)
    expect(reduce(29)).toBe(11)
    expect(reduce(38)).toBe(11)
    expect(reduce(33)).toBe(33)
    expect(reduce(17)).toBe(8)
  })
  it('keeps master numbers and single digits', () => {
    expect(reduce(11)).toBe(11)
    expect(reduce(22)).toBe(22)
    expect(reduce(7)).toBe(7)
  })
  it('repeats until done', () => {
    expect(reduce(99)).toBe(9) // 18 → 9
    expect(reduce(1999)).toBe(1) // 28 → 10 → 1
    expect(reduce(47)).toBe(11) // 11
  })
})

describe('isMaster', () => {
  it('is true only for 11, 22, 33', () => {
    expect([11, 22, 33].every(isMaster)).toBe(true)
    expect([1, 9, 10, 20, 44].some(isMaster)).toBe(false)
  })
})

describe('numRel', () => {
  it('matches the acceptance values', () => {
    expect(numRel(9, 11)).toEqual(['enemies', -3])
    expect(numRel(7, 11)).toEqual(['soulmates', 4])
    expect(numRel(22, 5)).toEqual(['friendly (master)', 2])
  })
  it('checks enemies in either order', () => {
    for (const [a, b] of [[1, 9], [2, 9], [3, 4], [4, 5], [5, 6], [7, 8], [9, 11], [9, 22]]) {
      expect(numRel(a, b)[1]).toBe(-3)
      expect(numRel(b, a)[1]).toBe(-3)
    }
  })
  it('soulmates either order', () => {
    expect(numRel(11, 7)).toEqual(['soulmates', 4])
  })
  it('match beats master-friendly', () => {
    expect(numRel(5, 5)).toEqual(['match', 3])
    expect(numRel(11, 11)).toEqual(['match', 3])
  })
  it('master-friendly and group-friendly', () => {
    expect(numRel(33, 1)).toEqual(['friendly (master)', 2])
    expect(numRel(1, 7)).toEqual(['friendly', 2])
    expect(numRel(2, 8)).toEqual(['friendly', 2])
    expect(numRel(3, 6)).toEqual(['friendly', 2])
  })
  it('enemies beat master-friendly', () => {
    expect(numRel(22, 9)).toEqual(['enemies', -3])
  })
  it('otherwise neutral', () => {
    expect(numRel(1, 2)).toEqual(['neutral', 0])
    expect(numRel(8, 5 + 1)).toEqual(['neutral', 0])
  })
})

describe('birth-date helpers', () => {
  it('lifePath and pinnacle', () => {
    expect(lifePath('1980-04-07')).toBe(11)
    expect(firstPinnacle(4, 7)).toBe(11)
    expect(firstPinnacle(12, 29)).toBe(5) // 3 + 11 = 14 → 5
  })
  it('parseDate rejects bad dates', () => {
    expect(parseDate('2026-02-30')).toBeNull()
    expect(parseDate('nope')).toBeNull()
    expect(parseDate('1990-4-12')).toEqual({ y: 1990, m: 4, d: 12 })
  })
})
