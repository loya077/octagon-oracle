/** Chinese zodiac: animal of the lunar year and animal relationships. */
import { parseDate, type Rel } from './numerology'

export const ANIMALS = [
  'Rat', 'Ox', 'Tiger', 'Cat', 'Dragon', 'Snake',
  'Horse', 'Goat', 'Monkey', 'Rooster', 'Dog', 'Pig',
] as const
export type Animal = (typeof ANIMALS)[number]

const ALIASES: Record<string, Animal> = { rabbit: 'Cat', hare: 'Cat', sheep: 'Goat', ram: 'Goat', rooster: 'Rooster', chicken: 'Rooster', boar: 'Pig' }

/** Normalise a user-entered animal name; Rabbit → Cat, Sheep → Goat. */
export function normalizeAnimal(name: string | null | undefined): Animal | null {
  if (!name) return null
  const k = name.trim().toLowerCase()
  if (!k) return null
  if (ALIASES[k]) return ALIASES[k]
  return ANIMALS.find((a) => a.toLowerCase() === k) ?? null
}

export const animalIndex = (a: Animal) => ANIMALS.indexOf(a)

/**
 * Lunar New Year (month, day) for each Gregorian year 1930–2040.
 * Packed as MMDD integers starting at 1930.
 */
const LNY_START = 1930
const LNY: number[] = [
  130, 217, 206, 126, 214, 204, 124, 211, 131, 219, // 1930
  208, 127, 215, 205, 125, 213, 202, 122, 210, 129, // 1940
  217, 206, 127, 214, 203, 124, 212, 131, 218, 208, // 1950
  128, 215, 205, 125, 213, 202, 121, 209, 130, 217, // 1960
  206, 127, 215, 203, 123, 211, 131, 218, 207, 128, // 1970
  216, 205, 125, 213, 202, 220, 209, 129, 217, 206, // 1980
  127, 215, 204, 123, 210, 131, 219, 207, 128, 216, // 1990
  205, 124, 212, 201, 122, 209, 129, 218, 207, 126, // 2000
  214, 203, 123, 210, 131, 219, 208, 128, 216, 205, // 2010
  125, 212, 201, 122, 210, 129, 217, 206, 126, 213, // 2020
  203, 123, 211, 131, 219, 208, 128, 215, 204, 124, // 2030
  212, // 2040
]

/** Lunar New Year of a Gregorian year as {m, d}; Feb 4 outside the table. */
export function lunarNewYear(year: number): { m: number; d: number } {
  const v = LNY[year - LNY_START]
  if (v === undefined) return { m: 2, d: 4 }
  return { m: Math.floor(v / 100), d: v % 100 }
}

/** Lunar year a Gregorian date falls in (before LNY → previous year). */
export function lunarYear(y: number, m: number, d: number): number {
  const lny = lunarNewYear(y)
  return m < lny.m || (m === lny.m && d < lny.d) ? y - 1 : y
}

export function animalOfYear(lunarYr: number): Animal {
  return ANIMALS[(((lunarYr - 4) % 12) + 12) % 12]
}

export function animalForDate(iso: string): Animal | null {
  const p = parseDate(iso)
  if (!p) return null
  return animalOfYear(lunarYear(p.y, p.m, p.d))
}

/** Zodiac relationship. Order: soulmates, enemies, trine, same, neutral. */
export function animalRel(aName: string, bName: string): Rel {
  const a = normalizeAnimal(aName)
  const b = normalizeAnimal(bName)
  if (!a || !b) return ['neutral', 0]
  const ia = animalIndex(a), ib = animalIndex(b)
  const diff = Math.abs(ia - ib)
  if ((a === 'Rat' && b === 'Ox') || (a === 'Ox' && b === 'Rat')) return ['soulmates', 4]
  if (diff === 6) return ['enemies', -3]
  if (diff !== 0 && diff % 4 === 0) return ['trine', 3]
  if (diff === 0) return ['same sign', 0]
  return ['neutral', 0]
}
