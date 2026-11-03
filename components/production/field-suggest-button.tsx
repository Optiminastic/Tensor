'use client'

import { Wand2 } from 'lucide-react'
import { useState, type JSX } from 'react'

import { suggestFields } from '@/app/dashboard/[brand]/production/design-fields-actions'
import { Button } from '@/components/ui/button'
import type { FieldMapWriteInput } from '@/lib/validators/registry'
import type { FieldSuggestion } from '@/lib/validators/registry-suggest'

interface FieldSuggestButtonProps {
  brand: string
  productCode: string
  role: string
  /** One colourway's own file, when the part keeps a file per child SKU. */
  sku?: string
  /** Whether the editor already holds rows. Replacing them is destructive, so
   *  the control says so rather than doing it quietly. */
  hasRows: boolean
  onSuggested: (rows: FieldMapWriteInput[], notes: FieldSuggestion[]) => void
}

/**
 * Fills the mapping from the design file and this product's own orders.
 *
 * The whole point of the feature, and the reason it is a BUTTON rather than
 * something that happens on open: the rows it writes are a proposal, the
 * person reads them, and nothing reaches the registry until they press Save
 * mapping. A mapping that applied itself would mean re-uploading a corrected
 * drawing silently re-pointed a live product's fields - and the first sign of
 * it would be a batch of planks with the names swapped.
 *
 * It REPLACES what is in the form, which is why it asks when the form is not
 * empty. Merging would be worse: a proposal half-folded into a hand-written
 * mapping is neither, and the editor saves the list whole.
 */
export function FieldSuggestButton({
  brand,
  productCode,
  role,
  sku,
  hasRows,
  onSuggested,
}: FieldSuggestButtonProps): JSX.Element {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirming, setConfirming] = useState(false)

  async function run(): Promise<void> {
    setError(null)
    setPending(true)
    const res = await suggestFields(brand, productCode, { role, sku })
    setPending(false)
    setConfirming(false)
    if (!res.ok || res.data === undefined) {
      setError(res.error ?? 'Could not work out a mapping for this design.')
      return
    }
    const { data } = res
    if (data.items.length === 0) {
      setError(
        'Nothing to propose. The design declares no variables an order could fill, ' +
          'or no recent order of this product carried any fields — in which case add ' +
          'the rows by hand, or annotate the .scad with @from comments.',
      )
      return
    }
    onSuggested(data.items.map(toRow), data.items)
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          disabled={pending}
          onClick={() => {
            if (hasRows && !confirming) {
              setConfirming(true)
              return
            }
            void run()
          }}
        >
          <Wand2 className="size-3.5" aria-hidden />
          {buttonLabel({ pending, confirming })}
        </Button>
        {confirming ? (
          <>
            <span className="text-muted-foreground text-xs">
              This replaces every row in the form. Nothing is saved until you press Save mapping.
            </span>
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground text-xs underline"
              onClick={() => setConfirming(false)}
            >
              Keep what I have
            </button>
          </>
        ) : null}
      </div>
      {error ? (
        <p role="alert" className="bg-warning-subtle text-warning rounded-2xl px-4 py-3 text-sm">
          {error}
        </p>
      ) : null}
    </div>
  )
}

/** One proposal as a row of the editor's own form. */
function toRow(s: FieldSuggestion): FieldMapWriteInput {
  return {
    property_key: s.property_key,
    scad_variable: s.scad_variable,
    value_type: s.value_type,
    optional: s.optional,
    fixed_value: s.fixed_value,
    default_value: s.default_value,
    max_runes: s.max_runes ?? undefined,
  }
}

/**
 * What the button says.
 *
 * The second press is the one that discards work, so it says what it will do
 * rather than repeating the name of the feature.
 */
function buttonLabel({ pending, confirming }: { pending: boolean; confirming: boolean }): string {
  if (pending) return 'Reading the design…'
  if (confirming) return 'Replace the rows below'
  return 'Suggest mapping'
}
