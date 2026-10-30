'use client'

import { useRouter } from 'next/navigation'
import { useState, type JSX } from 'react'

import { toggleProductPersonalisationLink } from '@/app/dashboard/[brand]/production/design-fields-actions'
import { Switch } from '@/components/ui/switch'
import type { RegistryVariant } from '@/lib/validators/registry'

interface ProductPersonalisationToggleProps {
  brand: string
  productCode: string
  variants: RegistryVariant[]
}

/**
 * Whether this product asks its customers before it prints.
 *
 * ONE SWITCH FOR THE PRODUCT, where there used to be one per colourway. The
 * column is still per variant - a variant is what an order resolves to, and
 * the sender reads it there - but the decision never was: a design either can
 * change after it is bought, or it cannot, and that is a fact about the
 * product rather than about its colours.
 *
 * Offered per SKU it was twenty switches that all had to agree, and one left
 * out of step is a single colourway silently skipping its customer. PWDH-W sat
 * that way unnoticed, which is what this replaces.
 *
 * MIXED IS SHOWN, NOT HIDDEN. A product whose SKUs disagree reads as on - one
 * enabled SKU is enough for an order to be asked about, which is the rule the
 * sender applies - and says so, because a switch that quietly represented
 * twenty disagreeing values as one is how the drift went unnoticed in the
 * first place. Flipping it settles them all.
 */
export function ProductPersonalisationToggle({
  brand,
  productCode,
  variants,
}: ProductPersonalisationToggleProps): JSX.Element | null {
  const router = useRouter()
  const live = variants.filter(v => v.status !== 'retired')
  const asking = live.filter(v => v.personalisation_link !== false)
  const mixed = asking.length > 0 && asking.length < live.length

  const [on, setOn] = useState(asking.length > 0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (live.length === 0) return null

  async function choose(next: boolean): Promise<void> {
    const previous = on
    setOn(next)
    setBusy(true)
    setError(null)
    const res = await toggleProductPersonalisationLink(brand, productCode, next)
    setBusy(false)
    if (!res.ok) {
      // Put back: a refused change that looks applied is worse than one that
      // visibly did not happen.
      setOn(previous)
      setError(res.error ?? 'Could not change that setting.')
      return
    }
    router.refresh()
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <label className="flex items-center gap-2">
        <span className="text-muted-foreground text-xs whitespace-nowrap">Asks the customer</span>
        <Switch
          checked={on}
          disabled={busy}
          onCheckedChange={next => void choose(next)}
          aria-label={`${productCode} asks its customers before printing`}
        />
      </label>
      {mixed ? (
        <span className="text-warning max-w-56 text-right text-xs text-pretty">
          {asking.length} of {live.length} SKUs ask today — switching settles them all.
        </span>
      ) : null}
      {error ? (
        <span role="alert" className="text-danger max-w-56 text-right text-xs text-pretty">
          {error}
        </span>
      ) : null}
    </div>
  )
}
