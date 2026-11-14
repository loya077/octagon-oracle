/** Readings score and the blended prediction. */
import { animalForDate, animalRel, normalizeAnimal, type Animal } from './astrology'
import { marketProb, hasMarket, type Moneyline } from './market'
import { bornDay, digitSum, firstPinnacle, isMaster, lifePath, numRel, parseDate, reduce, type RelLabel } from './numerology'

export interface Reading {
  bornDay: number | null
  lifePath: number | null
  pinnacle: number | null
  animal: string | null
}

export interface CompleteReading {
  bornDay: number
  lifePath: number
  pinnacle: number
  animal: Animal
}

export interface FightContext {
  lifePath: number
  day: number
  animal: Animal
}

export interface Settings {
  /** Readings influence, 0–100 (default 50). */
  influence: number
  /** Astrology weight, 0–100 (default 25). */
  wAstro: number
  /** Numerology weight, 0–100 (default 75). */
  wNum: number
  /** Master-number edge, 0–100 (default 100). */
  masterEdge: number
}

export const DEFAULT_SETTINGS: Settings = { influence: 50, wAstro: 25, wNum: 75, masterEdge: 100 }

export const SLOT_WEIGHTS = { pinnacle: 3, lifePath: 2, bornDay: 1 } as const
/** Master-number edge by slot. The pinnacle gets none. */
export const MASTER_BONUS = { pinnacle: 0, lifePath: 8, bornDay: 6 } as const
export const NUM_MAX = 48
export const AST_MAX = 4

/** All four reading values from a YYYY-MM-DD birth date. */
export function fromBirth(iso: string): CompleteReading | null {
  const p = parseDate(iso)
  if (!p) return null
  const animal = animalForDate(iso)
  if (!animal) return null
  return {
    bornDay: bornDay(p.d),
    lifePath: lifePath(iso),
    pinnacle: firstPinnacle(p.m, p.d),
    animal,
  }
}

/** Numerology/astrology context for the fight date. */
export function fightContext(iso: string): FightContext {
  const p = parseDate(iso)
  if (!p) throw new Error(`Bad fight date: ${iso}`)
  return {
    lifePath: reduce(digitSum(iso)),
    day: reduce(p.d),
    animal: animalForDate(iso)!,
  }
}

export function completeReading(r: Reading | null | undefined): CompleteReading | null {
  if (!r) return null
  const animal = normalizeAnimal(r.animal)
  const ok = (n: number | null) => typeof n === 'number' && Number.isFinite(n) && n > 0
  if (!ok(r.bornDay) || !ok(r.lifePath) || !ok(r.pinnacle) || !animal) return null
  return { bornDay: r.bornDay!, lifePath: r.lifePath!, pinnacle: r.pinnacle!, animal }
}

export type Slot = 'pinnacle' | 'lifePath' | 'bornDay'
export const SLOT_LABELS: Record<Slot, string> = { pinnacle: 'Pinnacle', lifePath: 'Life path', bornDay: 'Born day' }

export interface ScoreRow {
  kind: 'numerology' | 'master' | 'astrology'
  label: string
  note: string
  rel?: RelLabel
  points: number
}

export interface ReadingScore {
  rows: ScoreRow[]
  num: number
  astro: number
  total: number
}

const round1 = (x: number) => Math.round(x * 10) / 10

/** Score one fighter's readings against the fight context. Null if incomplete. */
export function scoreReading(
  reading: Reading | null | undefined,
  ctx: FightContext,
  s: Settings = DEFAULT_SETTINGS,
): ReadingScore | null {
  const r = completeReading(reading)
  if (!r) return null
  const rows: ScoreRow[] = []
  const slots: Slot[] = ['pinnacle', 'lifePath', 'bornDay']
  for (const slot of slots) {
    for (const [target, val] of [['fight life path', ctx.lifePath], ['fight day', ctx.day]] as const) {
      const v = r[slot]
      if (slot === 'pinnacle') {
        // The pinnacle counts only as an advantage, on an exact match with the
        // fight life path or the fight day (+3 × weight each). Nothing else scores.
        const hit = v === val
        rows.push({
          kind: 'numerology',
          label: `${SLOT_LABELS[slot]} × ${target}`,
          note: `${v} vs ${val}: ${hit ? 'match' : 'no match (counts only on a match)'}`,
          rel: hit ? 'match' : 'neutral',
          points: hit ? 3 * SLOT_WEIGHTS[slot] : 0,
        })
        continue
      }
      const [label, pts] = numRel(v, val)
      rows.push({
        kind: 'numerology',
        label: `${SLOT_LABELS[slot]} × ${target}`,
        note: `${v} vs ${val}: ${label}`,
        rel: label,
        points: pts * SLOT_WEIGHTS[slot],
      })
    }
  }
  const masters = slots.filter((sl) => MASTER_BONUS[sl] > 0 && isMaster(r[sl]))
  const masterPts = round1(
    slots.reduce((acc, sl) => acc + (isMaster(r[sl]) ? MASTER_BONUS[sl] : 0), 0) * (s.masterEdge / 100),
  )
  rows.push({
    kind: 'master',
    label: 'Master numbers',
    note: masters.length
      ? masters.map((sl) => `${SLOT_LABELS[sl].toLowerCase()} ${r[sl]}`).join(', ')
      : 'none',
    points: masterPts,
  })
  const [aLabel, aPts] = animalRel(r.animal, ctx.animal)
  rows.push({
    kind: 'astrology',
    label: 'Zodiac × fight year',
    note: `${r.animal} vs ${ctx.animal}: ${aLabel}`,
    rel: aLabel,
    points: aPts,
  })
  const num = rows.filter((x) => x.kind !== 'astrology').reduce((a, x) => a + x.points, 0)
  const astro = aPts
  const total = (s.wAstro / 10) * (astro / AST_MAX) + (s.wNum / 10) * (num / NUM_MAX) * 2
  return { rows, num: round1(num), astro, total }
}

export const sigmoid = (x: number) => 1 / (1 + Math.exp(-x))
export const logit = (p: number) => Math.log(p / (1 - p))

export type Tier = 'Lock' | 'Strong' | 'Lean' | 'Toss-up'

/** Confidence (0.5–1) → tier. Uses whole percentages, as displayed. */
export function tierFor(confidence: number): Tier {
  const pct = Math.round(confidence * 100)
  if (pct >= 80) return 'Lock'
  if (pct >= 65) return 'Strong'
  if (pct >= 55) return 'Lean'
  return 'Toss-up'
}

export interface FightInput {
  mlA: Moneyline
  mlB: Moneyline
  readingA: Reading | null | undefined
  readingB: Reading | null | undefined
}

export interface Prediction {
  /** Fighter A's blended win chance. */
  p: number
  pMarket: number
  pRead: number
  oDiff: number
  hasLine: boolean
  hasReadings: boolean
  scoreA: ReadingScore | null
  scoreB: ReadingScore | null
  pick: 'A' | 'B'
  confidence: number
  tier: Tier
  /** Pick the market alone (influence 0) would make. */
  marketPick: 'A' | 'B'
  upset: boolean
}

function pickFor(p: number, oDiff: number): 'A' | 'B' {
  if (p > 0.5) return 'A'
  if (p < 0.5) return 'B'
  return oDiff < 0 ? 'B' : 'A'
}

export function predict(f: FightInput, ctx: FightContext, s: Settings = DEFAULT_SETTINGS): Prediction {
  const scoreA = scoreReading(f.readingA, ctx, s)
  const scoreB = scoreReading(f.readingB, ctx, s)
  const hasReadings = !!scoreA && !!scoreB
  const oDiff = hasReadings ? scoreA!.total - scoreB!.total : 0
  const pRead = sigmoid(oDiff / 2.5)
  const pMarket = marketProb(f.mlA, f.mlB)
  const line = hasMarket(f.mlA, f.mlB)
  const lam = (s.influence / 100) * 0.3
  const p = sigmoid(logit(pMarket) + lam * oDiff)
  const pick = pickFor(p, oDiff)
  const marketPick = pickFor(pMarket, oDiff)
  const confidence = Math.max(p, 1 - p)
  return {
    p, pMarket, pRead, oDiff, hasLine: line, hasReadings, scoreA, scoreB,
    pick, confidence, tier: tierFor(confidence), marketPick,
    upset: line && pick !== marketPick,
  }
}

/** How the readings alone lean: A, B, or even. */
export function readingsLean(pr: Prediction): 'A' | 'B' | 'even' | 'none' {
  if (!pr.hasReadings) return 'none'
  if (Math.abs(pr.oDiff) < 1e-9) return 'even'
  return pr.oDiff > 0 ? 'A' : 'B'
}
