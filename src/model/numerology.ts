/** Numerology helpers and the numerology relationship table. */

export const MASTER_NUMBERS = [11, 22, 33] as const

/** Sum of every digit in a number or string (non-digits ignored). */
export function digitSum(n: number | string): number {
  let s = 0
  for (const ch of String(n)) {
    if (ch >= '0' && ch <= '9') s += ch.charCodeAt(0) - 48
  }
  return s
}

export function isMaster(n: number): boolean {
  return n === 11 || n === 22 || n === 33
}

/**
 * Reduce to a single digit, keeping master numbers.
 * Loop: 11/22/33 → keep; 20 → 11; < 10 → keep; else digit-sum and repeat.
 */
export function reduce(n: number): number {
  let x = Math.abs(Math.trunc(n))
  for (;;) {
    if (isMaster(x)) return x
    if (x === 20) return 11
    if (x < 10) return x
    x = digitSum(x)
  }
}

export type RelLabel =
  | 'enemies'
  | 'soulmates'
  | 'match'
  | 'friendly (master)'
  | 'friendly'
  | 'same sign'
  | 'trine'
  | 'neutral'

export type Rel = [label: RelLabel, points: number]

const NUM_ENEMIES: ReadonlyArray<[number, number]> = [
  [1, 9], [2, 9], [3, 4], [4, 5], [5, 6], [7, 8], [9, 11], [9, 22],
]

const NUM_GROUPS: ReadonlyArray<ReadonlyArray<number>> = [
  [1, 4, 7], [2, 5, 8], [3, 6, 9],
]

const pairIs = (a: number, b: number, x: number, y: number) =>
  (a === x && b === y) || (a === y && b === x)

/** Numerology relationship between two reduced numbers. */
export function numRel(a: number, b: number): Rel {
  if (NUM_ENEMIES.some(([x, y]) => pairIs(a, b, x, y))) return ['enemies', -3]
  if (pairIs(a, b, 7, 11)) return ['soulmates', 4]
  if (a === b) return ['match', 3]
  if (isMaster(a) || isMaster(b)) return ['friendly (master)', 2]
  if (NUM_GROUPS.some((g) => g.includes(a) && g.includes(b))) return ['friendly', 2]
  return ['neutral', 0]
}

/** Parse YYYY-MM-DD into parts; returns null when malformed. */
export function parseDate(iso: string): { y: number; m: number; d: number } | null {
  const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(iso.trim())
  if (!m) return null
  const y = +m[1], mo = +m[2], d = +m[3]
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null
  const dt = new Date(Date.UTC(y, mo - 1, d))
  if (dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null
  return { y, m: mo, d }
}

export const bornDay = (day: number) => reduce(day)
export const lifePath = (iso: string) => reduce(digitSum(iso))
export const firstPinnacle = (month: number, day: number) => reduce(reduce(month) + reduce(day))
