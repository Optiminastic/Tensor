import type { JSX } from 'react'

import { StatusPill } from '@/components/ui/status-pill'
import { inr, pct } from '@/lib/format'
import type { DesignPricing } from '@/lib/validators/designs'

import { ReviewCheck } from './review-check'

interface ReviewSummaryProps {
  pricing: DesignPricing
}

/** What is being decided, in one glance: verdict, price, cost share and the two checks. */
export function ReviewSummary({ pricing }: ReviewSummaryProps): JSX.Element {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end gap-x-8 gap-y-3">
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground text-xs">Recommended price</span>
          <span className="text-4xl font-medium tracking-[-0.04em] tabular-nums">
            {pricing.recommended_sp !== null ? inr(pricing.recommended_sp) : '-'}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground text-xs">Cost share of price</span>
          <span className="text-2xl font-medium tracking-tight tabular-nums">
            {pct(pricing.cp_pct_at_recommended ?? pricing.cp_pct)}
          </span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-muted-foreground text-xs">Design CP</span>
          <span className="text-2xl font-medium tracking-tight tabular-nums">
            {inr(pricing.design_cp, 2)}
          </span>
        </div>
        <StatusPill status={pricing.verdict} className="mb-1.5" />
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        <ReviewCheck passed={pricing.passes_normal} label="Passes at 30% ad spend" />
        <ReviewCheck passed={pricing.survives_stress} label="Survives the 40% stress test" />
      </div>
    </div>
  )
}
