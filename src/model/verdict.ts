/** Rank every fight of an event by confidence. */
import { fightContext, predict, type Prediction, type Reading, type Settings } from './predict'

export interface VerdictFight {
  id: string
  a: { name: string; ml: number | null; reading: Reading | null }
  b: { name: string; ml: number | null; reading: Reading | null }
}

export interface VerdictRow<F extends VerdictFight = VerdictFight> {
  fight: F
  pred: Prediction
  winner: F['a']
  loser: F['a']
}

export function buildVerdict<F extends VerdictFight>(fights: F[], date: string, s: Settings): VerdictRow<F>[] {
  const ctx = fightContext(date)
  return fights
    .map((fight) => {
      const pred = predict({ mlA: fight.a.ml, mlB: fight.b.ml, readingA: fight.a.reading, readingB: fight.b.reading }, ctx, s)
      const winner = pred.pick === 'A' ? fight.a : fight.b
      const loser = pred.pick === 'A' ? fight.b : fight.a
      return { fight, pred, winner, loser }
    })
    .sort((x, y) => y.pred.confidence - x.pred.confidence)
}
