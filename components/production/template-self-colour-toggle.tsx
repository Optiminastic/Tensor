'use client'

import { useRouter } from 'next/navigation'
import { useState, type JSX } from 'react'

import { setTemplateSelfColourAction } from '@/app/dashboard/[brand]/production/design-template-actions'
import { Switch } from '@/components/ui/switch'
import type { DesignTemplate } from '@/lib/validators/registry'

interface TemplateSelfColourToggleProps {
  brand: string
  template: DesignTemplate
}

/**
 * Whether this file names its own colours.
 *
 * On, Tensor reads the file's `<PIECE>_COLOR` declarations and uses them —
 * nothing about colour is configured for a SKU printing from it. Off, the
 * pieces and their colours are the ones typed into the product's colour
 * scheme, which is how everything printing today works.
 *
 * IT STILL RENDERS ONE PASS PER PIECE either way, and that is worth being
 * clear about because the obvious reading of "the file holds its colours" is
 * "render it once". OpenSCAD's STL output carries no colour, so a single
 * render comes out a single colour — the lotus losing its gold text and its
 * pink outline. This changes where the colours come from, not how the model
 * is built.
 *
 * A PROPERTY OF THE FILE, not of a product: one file assigned to five SKUs
 * paints itself in all five.
 */
export function TemplateSelfColourToggle({
  brand,
  template,
}: TemplateSelfColourToggleProps): JSX.Element {
  const router = useRouter()
  const [on, setOn] = useState(template.self_coloured === true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function toggle(next: boolean): Promise<void> {
    const previous = on
    setOn(next)
    setBusy(true)
    setError(null)
    const res = await setTemplateSelfColourAction(brand, template.key, next)
    setBusy(false)
    if (!res.ok) {
      // Put back, because the switch is the only thing on screen saying which
      // way it went and a refused change that looks applied is worse than one
      // that visibly did not happen.
      setOn(previous)
      setError(res.error ?? 'Could not change that file.')
      return
    }
    router.refresh()
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <Switch
        checked={on}
        disabled={busy}
        onCheckedChange={next => void toggle(next)}
        aria-label={`${template.key} sets its own colours`}
      />
      {error ? (
        <span role="alert" className="text-danger max-w-64 text-xs text-pretty">
          {error}
        </span>
      ) : null}
    </div>
  )
}
