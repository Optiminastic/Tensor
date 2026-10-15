import { describe, expect, it } from 'vitest'

import { costRoom, fixedCostTotal } from './rules'

describe('costRoom', () => {
  it('is what the four margins leave of the price', () => {
    const room = costRoom({
      ad_spend_pct: 0.3,
      team_pct: 0.12,
      overhead_pct: 0.05,
      target_profit_pct: 0.15,
    })
    expect(room).toBeCloseTo(0.38)
  })

  it('never goes below zero', () => {
    expect(
      costRoom({ ad_spend_pct: 0.6, team_pct: 0.3, overhead_pct: 0.2, target_profit_pct: 0.1 }),
    ).toBe(0)
  })
})

describe('fixedCostTotal', () => {
  it('adds every fixed cost', () => {
    expect(
      fixedCostTotal({
        packaging: 60,
        shipping: 50,
        rto_cod: 20,
        payment_gateway: 40,
        tech_allocation: 0,
        other: 5,
      }),
    ).toBe(175)
  })
})
