/** View-model types and small formatting helpers shared by components. */
import type { Prediction, Reading } from '../model/predict'
import { lastName } from './names'

export interface ReadingEdit extends Reading {
  birth?: string
}

export interface Fighter {
  key: string
  name: string
  record: string
  ml: number | null
  baseMl: number | null
  reading: ReadingEdit
  ownerReading: Reading
  edited: boolean
}

export interface Fight {
  id: string
  order: number
  segment: string
  division: string
  rounds: number
  title?: string
  caveat?: string
  a: Fighter
  b: Fighter
}

export interface Analysis {
  fight: Fight
  pred: Prediction
  winner: Fighter
  loser: Fighter
}

export type Agreement = 'agree' | 'split' | 'even' | 'none'

export function agreement(an: Analysis): Agreement {
  const { pred } = an
  if (!pred.hasReadings) return 'none'
  if (Math.abs(pred.oDiff) < 1e-9) return 'even'
  const lean = pred.oDiff > 0 ? 'A' : 'B'
  return lean === pred.pick ? 'agree' : 'split'
}

export function agreementLabel(an: Analysis): string {
  switch (agreement(an)) {
    case 'agree': return 'Readings agree'
    case 'even': return 'Readings even'
    case 'none': return 'No readings'
    case 'split': return `Readings: ${lastName(an.pred.oDiff > 0 ? an.fight.a.name : an.fight.b.name)}`
  }
}

export const pct = (p: number, digits = 0) => `${(p * 100).toFixed(digits)}%`

/** Signed number with a real minus sign. */
export function signed(n: number, digits = 1): string {
  const r = Number(n.toFixed(digits))
  if (r === 0) return (0).toFixed(digits)
  return r > 0 ? `+${r.toFixed(digits)}` : `−${Math.abs(r).toFixed(digits)}`
}

export function recordWinRate(record: string): number | null {
  const [w, l, d] = record.split('-').map((x) => Number(x) || 0)
  const n = w + l + d
  return n ? w / n : null
}

export function callLabel(an: Analysis): string {
  if (an.pred.upset) return 'Oracle upset'
  return an.pred.hasLine ? an.pred.tier : `${an.pred.tier} (no line)`
}

export function fightTitle(f: Fight): string {
  return f.title ?? f.division
}
