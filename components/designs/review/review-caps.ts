import type { DesignLifecycle, Verdict } from '@/lib/validators/designs'

/** What the viewer's role may do in review. UX only; the backend enforces it. */
export interface ReviewCaps {
  canSubmit: boolean
  canApprove: boolean
  canReject: boolean
}

export interface ReviewActions {
  submit: boolean
  approve: boolean
  sendBack: boolean
}

/**
 * Which review actions apply right now. Matches the backend guards
 * (designs_review.go): only a priced design that is not Red may be submitted,
 * and only a submitted one may be approved or sent back. A design sent back is
 * re-sliced to 'priced' before it can be submitted again.
 */
export function reviewActions(
  status: DesignLifecycle,
  verdict: Verdict | null,
  caps: ReviewCaps,
): ReviewActions {
  const inReview = status === 'submitted'
  return {
    submit: caps.canSubmit && status === 'priced' && verdict !== 'red',
    approve: caps.canApprove && inReview,
    sendBack: caps.canReject && inReview,
  }
}
