'use client'

import { useState, type JSX } from 'react'

import { toggleVariantPersonalisationLink } from '@/app/dashboard/[brand]/production/design-fields-actions'
import { Switch } from '@/components/ui/switch'
import type { RegistryVariant } from '@/lib/validators/registry'

interface PersonalisationLinkToggleProps {
  brand: string
  variant: RegistryVariant
}

/**
 * Whether this SKU's customer is asked to confirm before it prints.
 *
 * Off skips the personalisation link and the thirty-minute hold, so the job
 * renders and batches straight away - which is what a product nobody needs to
 * ask about should do.
 *
 * Optimistic, and safe to be: the only thing that can fail is the request, and
 * a failure puts the switch back and says why. Nothing downstream has acted on
 * it in between, because the setting is read when an order arrives rather than
 * held anywhere.
 */
export function PersonalisationLinkToggle({
  brand,
  variant,
}: PersonalisationLinkToggleProps): JSX.Element {
  const [on, setOn] = useState(variant.personalisation_link)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  async function change(next: boolean): Promise<void> {
    setOn(next)
    setBusy(true)
    setError('')
    const result = await toggleVariantPersonalisationLink(brand, variant.id, next)
    if (!result.ok) {
      setOn(!next)
      setError(result.error ?? 'Could not change that setting.')
    }
    setBusy(false)
  }

  return (
    <span className="flex flex-col gap-1">
      <Switch
        checked={on}
        disabled={busy}
        onCheckedChange={next => void change(next)}
        aria-label={`Ask the customer to confirm ${variant.sku ?? variant.name}`}
      />
      {error ? <span className="text-danger text-xs">{error}</span> : null}
    </span>
  )
}
