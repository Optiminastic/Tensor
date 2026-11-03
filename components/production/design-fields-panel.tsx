'use client'

import { Plus } from 'lucide-react'
import { useCallback, useEffect, useState, type JSX } from 'react'

import {
  createPart,
  loadPreviewDesigns,
  loadProductParts,
} from '@/app/dashboard/[brand]/production/design-fields-actions'
import { DesignPartEditor } from '@/components/production/design-part-editor'
import { PartAddDialog } from '@/components/production/part-add-dialog'
import { PartSettingsDialog } from '@/components/production/part-settings-dialog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ProductPart, RegistryProductDetail } from '@/lib/validators/registry'

interface DesignFieldsPanelProps {
  brand: string
  product: RegistryProductDetail
}

/**
 * What this product prints, and which order field fills each variable of it.
 *
 * A product used to print one thing, so this was one template and one mapping.
 * A Soulmate Combo is three printed things sold as one line - a plank, a rose
 * and a keychain - and as one job it rendered only the plank: the rose's name
 * and the keychain's were stored on the order and silently never read.
 *
 * So a product carries a LIST of design files, each with its own template, its
 * own variables and its own fields from the customer. One file is the ordinary
 * case and still reads as one panel.
 *
 * Loaded when opened rather than with the page. The observed properties are
 * read from two hundred recent orders, and making every visit to the registry
 * pay for a panel nobody opened would be the wrong trade.
 */
export function DesignFieldsPanel({ brand, product }: DesignFieldsPanelProps): JSX.Element {
  const [parts, setParts] = useState<ProductPart[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [chosen, setChosen] = useState('')
  // Which file each SKU's customer preview is drawn from, by SKU. Read once
  // for the product: a row asking for itself would be one request per
  // colourway, and this panel shows every colourway at once.
  const [previewBySKU, setPreviewBySKU] = useState<Record<string, string>>({})

  useEffect(() => {
    let cancelled = false
    void loadPreviewDesigns(brand, product.code).then(res => {
      if (cancelled || !res.ok || !res.data) return
      setPreviewBySKU(Object.fromEntries(res.data.map(d => [d.variant_sku, d.template_key])))
    })
    return () => {
      cancelled = true
    }
  }, [brand, product.code])

  const refresh = useCallback(async (): Promise<void> => {
    const res = await loadProductParts(brand, product.code)
    if (!res.ok) {
      setError(res.error ?? 'Could not read what this product prints.')
      return
    }
    const next = res.data ?? []
    setParts(next)
    // Keep the open part open across a refresh, unless it has gone.
    setChosen(current =>
      current !== '' && next.some(p => p.role === current) ? current : (next[0]?.role ?? ''),
    )
  }, [brand, product.code])

  useEffect(() => {
    setParts(null)
    setError(null)
    void refresh()
  }, [refresh])

  if (error) {
    return (
      <p role="alert" className="text-danger mt-3 text-sm">
        {error}
      </p>
    )
  }
  if (!parts) {
    return <p className="text-muted-foreground mt-3 text-sm">Loading…</p>
  }

  const addControl = (
    <PartAddDialog
      existingRoles={parts.map(p => p.role)}
      onAdd={async (role, perVariant) => {
        const res = await createPart(brand, product.code, { role, per_variant: perVariant })
        if (!res.ok) throw new Error(res.error ?? 'Could not add the part.')
        setChosen(role)
        await refresh()
      }}
      trigger={
        <Button variant="secondary" size="sm">
          <Plus className="size-3.5" aria-hidden />
          Add part
        </Button>
      }
    />
  )

  const shown = parts

  if (shown.length === 0) {
    // A PRODUCT JUST IMPORTED FROM SHOPIFY LANDS HERE.
    //
    // It used to land on a list of every child SKU with a file picker each,
    // on the reasoning that showing the colourways beat showing nothing. That
    // was the wrong first question. A product does not print "a file per
    // SKU", it prints PARTS - one for a plank, three for a combo - and the
    // SKUs only mean anything underneath one of them. Asked the other way
    // round, a combo's eight SKUs were offered before anyone had said there
    // were three things to print, and the plank's file was the only one the
    // screen had room to ask for.
    return (
      <div className="mt-3 flex flex-col items-start gap-3">
        <p className="text-muted-foreground max-w-prose text-sm text-pretty">
          Nothing prints this product yet. Name what it prints — most products print one thing, a
          combo prints several and each becomes its own job, on its own bed, in its own colour.
          Every SKU&rsquo;s files are chosen inside the part.
        </p>
        {addControl}
      </div>
    )
  }

  const part = shown.find(p => p.role === chosen) ?? shown[0]

  return (
    <div className="mt-3 flex flex-col gap-3">
      {/* Shown even for one part, so a product that gains a second does not
          rearrange itself into something unfamiliar. */}
      <div className="flex flex-wrap items-center gap-2">
        <nav className="flex flex-wrap gap-1" aria-label="Design files">
          {shown.map(p => (
            <button
              key={p.role}
              type="button"
              onClick={() => setChosen(p.role)}
              aria-current={p.role === part?.role}
              className={cn(
                'border-border flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-sm',
                p.role === part?.role ? 'bg-surface-muted border-l-accent border-l-2' : '',
              )}
            >
              {p.role}
              {/* A part that cannot render says so here rather than only
                  inside itself, because the whole point of the list is to
                  see at a glance which of three is unfinished. */}
              <span
                aria-hidden
                className={cn('size-1.5 rounded-full', p.ready ? 'bg-success' : 'bg-warning')}
              />
              <span className="sr-only">{p.ready ? 'ready' : 'not configured'}</span>
            </button>
          ))}
        </nav>
        {addControl}
        {part?.id ? (
          <PartSettingsDialog brand={brand} part={part} onChanged={() => void refresh()} />
        ) : null}
      </div>

      {part ? (
        <DesignPartEditor
          // Remounts on a part change, so the mapping editor's own draft state
          // cannot carry the rose's rows into the keychain.
          key={part.role}
          previewBySKU={previewBySKU}
          brand={brand}
          product={product}
          part={part}
          onChanged={() => void refresh()}
        />
      ) : null}
    </div>
  )
}
