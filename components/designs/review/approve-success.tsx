import { Check } from 'lucide-react'
import type { JSX } from 'react'

import { PillButton } from '@/components/landing/pill-button'
import { DialogDescription, DialogTitle } from '@/components/ui/dialog'

interface ApproveSuccessProps {
  designName: string
  onDone: () => void
}

/** After approving: what happened, and what comes next. */
export function ApproveSuccess({ designName, onDone }: ApproveSuccessProps): JSX.Element {
  return (
    <div className="flex flex-col items-center gap-4 py-4 text-center">
      <span className="bg-landing-lime text-landing-ink grid size-14 place-items-center rounded-full">
        <Check className="size-7" strokeWidth={2.5} aria-hidden />
      </span>
      <div className="flex flex-col gap-1">
        <DialogTitle className="text-2xl font-medium tracking-tight">Approved</DialogTitle>
        <DialogDescription className="text-pretty">
          {designName} is ready to publish. Use Publish to Shopify at the top of the page when the
          listing is ready.
        </DialogDescription>
      </div>
      <PillButton tone="lime" withArrow onClick={onDone} className="mt-2">
        Done
      </PillButton>
    </div>
  )
}
