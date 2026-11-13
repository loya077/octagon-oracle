/** Betting-market baseline from American moneylines. */

export type Moneyline = number | null | undefined

/** Moneyline → implied chance (includes the bookmaker's cut). */
export function impliedProb(ml: number): number {
  return ml < 0 ? -ml / (-ml + 100) : 100 / (ml + 100)
}

const hasLine = (ml: Moneyline): ml is number =>
  typeof ml === 'number' && Number.isFinite(ml) && ml !== 0

export function hasMarket(mlA: Moneyline, mlB: Moneyline): boolean {
  return hasLine(mlA) && hasLine(mlB)
}

/** Fighter A's no-vig chance; 0.5 when either line is missing. */
export function marketProb(mlA: Moneyline, mlB: Moneyline): number {
  if (!hasLine(mlA) || !hasLine(mlB)) return 0.5
  const iA = impliedProb(mlA)
  const iB = impliedProb(mlB)
  return iA / (iA + iB)
}

/** Format a moneyline as "−225" / "+185". */
export function fmtMoneyline(ml: Moneyline): string {
  if (!hasLine(ml)) return '—'
  return ml > 0 ? `+${ml}` : `−${Math.abs(ml)}`
}
