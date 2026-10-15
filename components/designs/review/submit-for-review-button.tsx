'use client'

import { useState, type JSX } from 'react'

import { submitForReview } from '@/app/dashboard/[brand]/designs/actions'
import { PillButton } from '@/components/landing/pill-button'

import { FormError } from './form-error'

interface SubmitForReviewButtonProps {
  brand: string
  designId: string
  onDone: () => void
}

/** The designer's one action: hand a priced design to the Project Lead. */
export function SubmitForReviewButton({
  brand,
  designId,
  onDone,
}: SubmitForReviewButtonProps): JSX.Element {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function submit(): Promise<void> {
    setPending(true)
    setError(null)
    const result = await submitForReview(brand, designId)
    setPending(false)
    if (!result.ok) return setError(result.error ?? 'The design was not submitted.')
    onDone()
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <PillButton tone="lime" withArrow disabled={pending} onClick={() => void submit()}>
        {pending ? 'Submitting...' : 'Submit for review'}
      </PillButton>
      <FormError error={error} />
    </div>
  )
}
