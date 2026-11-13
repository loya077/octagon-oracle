import { describe, expect, it } from 'vitest'
import { fmtMoneyline, impliedProb, marketProb } from './market'

describe('market', () => {
  it('converts moneylines to implied chance', () => {
    expect(impliedProb(-225)).toBeCloseTo(225 / 325, 10)
    expect(impliedProb(185)).toBeCloseTo(100 / 285, 10)
    expect(impliedProb(100)).toBe(0.5)
  })
  it('removes the vig', () => {
    const p = marketProb(-225, 185)
    expect(p).toBeCloseTo((225 / 325) / (225 / 325 + 100 / 285), 10)
    expect(p + marketProb(185, -225)).toBeCloseTo(1, 10)
  })
  it('is 0.5 when a line is missing', () => {
    expect(marketProb(null, null)).toBe(0.5)
    expect(marketProb(-150, null)).toBe(0.5)
  })
  it('formats', () => {
    expect(fmtMoneyline(-225)).toBe('−225')
    expect(fmtMoneyline(185)).toBe('+185')
    expect(fmtMoneyline(null)).toBe('—')
  })
})
