import type { FixedCosts, Margins } from '@/lib/validators/config'

/**
 * The share of the selling price left for cost once ad spend, team, overhead
 * and target profit are taken - what the engine reverses a price out of.
 * Never below zero: the backend refuses margins that sum to 1 or more.
 */
export function costRoom(margins: Margins): number {
  const taken =
    margins.ad_spend_pct + margins.team_pct + margins.overhead_pct + margins.target_profit_pct
  return Math.max(0, 1 - taken)
}

/** What every order carries on top of Design CP, in rupees. */
export function fixedCostTotal(fixed: FixedCosts): number {
  return (
    fixed.packaging +
    fixed.shipping +
    fixed.rto_cod +
    fixed.payment_gateway +
    fixed.tech_allocation +
    fixed.other
  )
}
