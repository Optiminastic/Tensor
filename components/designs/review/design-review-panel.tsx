import type { JSX } from 'react'

import type { DesignDetail } from '@/lib/validators/designs'

import { ApproveSheet } from './approve-sheet'
import { type ReviewCaps, reviewActions } from './review-caps'
import { ReviewSummary } from './review-summary'
import { SendBackSheet } from './send-back-sheet'
import { SubmitForReviewButton } from './submit-for-review-button'

interface DesignReviewPanelProps {
  brand: string
  design: DesignDetail
  caps: ReviewCaps
  onDone: () => void
}

/**
 * The review decision as one card: what is being decided (price, cost share,
 * checks) beside the actions that apply to this viewer right now. Renders
 * nothing when the viewer has no action on this design.
 */
export function DesignReviewPanel({
  brand,
  design,
  caps,
  onDone,
}: DesignReviewPanelProps): JSX.Element | null {
  const pricing = design.pricing
  const can = reviewActions(design.status, pricing?.verdict ?? null, caps)
  if (!can.submit && !can.approve && !can.sendBack) return null

  return (
    <section
      aria-labelledby="review-decision"
      className="bg-surface ring-border flex flex-col gap-6 rounded-3xl p-6 ring-1 lg:flex-row lg:items-end lg:justify-between"
    >
      <div className="flex flex-col gap-4">
        <h2
          id="review-decision"
          className="text-muted-foreground font-mono text-xs tracking-[0.18em] uppercase"
        >
          {can.submit ? 'Ready for review' : 'Review decision'}
        </h2>
        {pricing ? <ReviewSummary pricing={pricing} /> : null}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {can.submit ? (
          <SubmitForReviewButton brand={brand} designId={design.id} onDone={onDone} />
        ) : null}
        {can.sendBack ? <SendBackSheet brand={brand} designId={design.id} onDone={onDone} /> : null}
        {can.approve ? (
          <ApproveSheet
            brand={brand}
            designId={design.id}
            designName={design.name}
            price={pricing?.recommended_sp ?? null}
            onDone={onDone}
          />
        ) : null}
      </div>
    </section>
  )
}
