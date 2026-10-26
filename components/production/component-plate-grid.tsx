'use client'

import { Check, Trash2, Upload } from 'lucide-react'
import { useRef, useState, type JSX } from 'react'

import {
  deleteComponentPlateAction,
  uploadComponentPlateAction,
} from '@/app/dashboard/[brand]/production/component-actions'
import { Button } from '@/components/ui/button'
import type { ComponentPlate, PlateScope } from '@/lib/validators/inventory'
import type { ShopifyVariant } from '@/lib/validators/shopify-products'

/** The machine classes the shop prints on, as the backend names them. */
export const FAMILIES = ['H2C', 'A2L', 'P2S'] as const

interface ComponentPlateGridProps {
  brand: string
  itemId: string
  /** The product's SKUs, which are the rows. Ignored when shared. */
  variants: ShopifyVariant[]
  plates: ComponentPlate[]
  /** 'shared' collapses the grid to one row serving every SKU. */
  scope: PlateScope
  disabled: boolean
  onChanged: (plates: ComponentPlate[]) => void
}

/** The one row a shared component shows, addressed by no SKU at all. */
const SHARED_ROW: ShopifyVariant = { id: 'shared', sku: '', title: 'Every SKU' }

/**
 * One finished file per SKU per machine class.
 *
 * A grid rather than a list because the shape of the job is a grid: three
 * colourways across three machines is nine files, and the thing somebody needs
 * to see at a glance is which of the nine are missing.
 *
 * Per SKU and not just per machine because a sliced file has the filament
 * baked into it - the purple plate is not the red one, however identical the
 * geometry.
 */
export function ComponentPlateGrid({
  brand,
  itemId,
  variants,
  plates,
  scope,
  disabled,
  onChanged,
}: ComponentPlateGridProps): JSX.Element {
  // One row for a shared part, one per SKU otherwise. The rest of the grid
  // does not care which: a shared plate is simply one with no SKU.
  const rows = scope === 'shared' ? [SHARED_ROW] : variants
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const target = useRef<{ sku: string; family: string } | null>(null)
  const fileInput = useRef<HTMLInputElement>(null)

  function plateFor(sku: string, family: string): ComponentPlate | undefined {
    return plates.find(p => p.sku === sku && p.machine_family === family)
  }

  function pick(sku: string, family: string): void {
    target.current = { sku, family }
    fileInput.current?.click()
  }

  async function upload(file: File): Promise<void> {
    const at = target.current
    if (!at) return
    setBusy(`${at.sku}/${at.family}`)
    setError(null)
    const form = new FormData()
    form.append('file', file)
    const res = await uploadComponentPlateAction(
      { brand, id: itemId, sku: at.sku, family: at.family },
      form,
    )
    setBusy(null)
    if (!res.ok || !res.data) {
      setError(res.error ?? 'Could not store the plate.')
      return
    }
    const saved = res.data
    onChanged([
      ...plates.filter(p => !(p.sku === saved.sku && p.machine_family === saved.machine_family)),
      saved,
    ])
  }

  async function remove(plate: ComponentPlate): Promise<void> {
    setBusy(`${plate.sku}/${plate.machine_family}`)
    setError(null)
    const res = await deleteComponentPlateAction({
      brand,
      id: itemId,
      sku: plate.sku,
      family: plate.machine_family,
    })
    setBusy(null)
    if (!res.ok) {
      setError(res.error ?? 'Could not remove the plate.')
      return
    }
    onChanged(
      plates.filter(p => !(p.sku === plate.sku && p.machine_family === plate.machine_family)),
    )
  }

  const total = rows.length * FAMILIES.length
  // Only the plates this mode addresses. Switching mode leaves the others
  // stored rather than deleting them, so a mistaken switch is reversible.
  const shown = plates.filter(p => (scope === 'shared' ? p.sku === '' : p.sku !== ''))
  const have = shown.length
  const stranded = plates.length - shown.length

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-sm font-medium">Print files</h3>
        <span className="text-subtle-foreground font-mono text-xs tabular-nums">
          {have} of {total}
        </span>
      </div>
      <p className="text-muted-foreground text-xs">
        One sliced file per SKU per machine &mdash; the filament is baked into it, so each colourway
        needs its own.
      </p>

      <input
        ref={fileInput}
        type="file"
        accept=".gcode,.3mf"
        className="hidden"
        onChange={e => {
          const file = e.target.files?.[0]
          if (file) void upload(file)
          e.target.value = ''
        }}
      />

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-border border-b">
              <th className="text-muted-foreground py-1.5 text-left font-normal">SKU</th>
              {FAMILIES.map(f => (
                <th key={f} className="text-muted-foreground py-1.5 text-left font-normal">
                  {f}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(v => (
              <tr key={v.id} className="border-border/70 border-b last:border-0">
                <td className="py-1.5">
                  <code className="font-mono text-xs whitespace-nowrap">
                    {v.sku === '' ? 'no SKU' : v.sku}
                  </code>
                  <span className="text-subtle-foreground ml-2 text-xs">{v.title}</span>
                </td>
                {FAMILIES.map(f => {
                  const plate = plateFor(v.sku, f)
                  const working = busy === `${v.sku}/${f}`
                  return (
                    <td key={f} className="py-1.5">
                      {plate ? (
                        <span className="flex items-center gap-1">
                          <Check className="text-success size-3.5 shrink-0" aria-hidden />
                          <span
                            className="text-muted-foreground max-w-32 truncate text-xs"
                            title={plate.filename}
                          >
                            {plate.filename}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled={disabled || working}
                            aria-label={`Remove the ${f} file for ${v.sku}`}
                            onClick={() => void remove(plate)}
                          >
                            <Trash2 className="size-3.5" aria-hidden />
                          </Button>
                        </span>
                      ) : (
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={disabled || working || (scope !== 'shared' && v.sku === '')}
                          onClick={() => pick(v.sku, f)}
                        >
                          <Upload className="size-3.5" aria-hidden />
                          {working ? 'Uploading…' : 'Add'}
                        </Button>
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {stranded > 0 ? (
        <p className="text-muted-foreground text-xs">
          {stranded} file{stranded === 1 ? '' : 's'} stored for the other mode. They are kept, not
          deleted &mdash; switch back to see them.
        </p>
      ) : null}

      {/* A variant with no SKU cannot carry a file, because the SKU is what a
          plate is addressed by. Said here rather than left as a dead button. */}
      {scope !== 'shared' && variants.some(v => v.sku === '') ? (
        <p className="text-warning text-xs">
          A variant with no SKU in Shopify cannot hold a file &mdash; give it one there first.
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="text-danger text-sm">
          {error}
        </p>
      ) : null}
    </div>
  )
}
