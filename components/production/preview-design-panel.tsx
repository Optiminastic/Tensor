'use client'

import { useCallback, useEffect, useState, type JSX } from 'react'

import {
  assignPreviewDesign,
  loadPreviewDesigns,
  removePreviewDesign,
} from '@/app/dashboard/[brand]/production/design-fields-actions'
import { useDesignTemplates } from '@/components/production/design-templates-context'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { PreviewDesign } from '@/lib/validators/preview-design'

interface PreviewDesignPanelProps {
  brand: string
  productCode: string
  /** Every SKU of this product, so one colourway can be given its own file. */
  variantSkus: string[]
}

/**
 * The file the customer is shown, which is not the file that prints.
 *
 * A product is rarely one printed thing. A Lotus diya holder is a plate and a
 * cup that pushes onto it; a Royal is a plate, a foot and a cup. Only the
 * plate carries the name, so only the plate goes on a bed - and the customer
 * approving their order on the personalisation link was being shown that
 * plate alone, which is a diya holder with no holder.
 *
 * So a product may name a second .scad: the whole assembled product, drawn
 * for the picture and for nothing else.
 */
export function PreviewDesignPanel({
  brand,
  productCode,
  variantSkus,
}: PreviewDesignPanelProps): JSX.Element {
  const [rows, setRows] = useState<PreviewDesign[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    const result = await loadPreviewDesigns(brand, productCode)
    if (result.ok) {
      setRows(result.data ?? [])
      return
    }
    setError(result.error ?? 'Could not read the preview files.')
  }, [brand, productCode])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const run = useCallback(
    async (work: () => Promise<{ ok: boolean; error?: string }>) => {
      setBusy(true)
      setError('')
      const result = await work()
      // Tensor-Core names the variables a rejected file is missing. Passing
      // its own words through is the difference between a message somebody
      // can act on and "Request failed".
      if (!result.ok) setError(result.error ?? 'That did not work.')
      else await refresh()
      setBusy(false)
    },
    [refresh],
  )

  return (
    <div className="flex flex-col gap-4">
      <PreviewExplainer />
      <PreviewDesignList
        rows={rows}
        busy={busy}
        onRemove={sku => void run(() => removePreviewDesign(brand, productCode, sku))}
      />
      <PreviewDesignForm
        productCode={productCode}
        variantSkus={variantSkus}
        busy={busy}
        onAssign={input => void run(() => assignPreviewDesign(brand, productCode, input))}
      />
      {error ? <p className="text-danger text-sm">{error}</p> : null}
    </div>
  )
}

function PreviewExplainer(): JSX.Element {
  return (
    <p className="text-muted-foreground text-sm">
      An OpenSCAD file of the whole assembled product, drawn on the customer&rsquo;s personalisation
      link so they approve what they will receive. It is never sliced and never reaches a printer
      &mdash; the model that goes to a bed is the personalised part alone. It is driven by the same
      order fields as the printed design, so the two cannot carry different names.
    </p>
  )
}

interface PreviewDesignListProps {
  rows: PreviewDesign[]
  busy: boolean
  onRemove: (variantSku: string) => void
}

function PreviewDesignList({ rows, busy, onRemove }: PreviewDesignListProps): JSX.Element {
  if (rows.length === 0) {
    return (
      <p className="text-subtle-foreground text-sm">
        No preview file. The picture on the personalisation link is a picture of the model that
        prints.
      </p>
    )
  }
  return (
    <ul className="flex flex-col gap-1.5">
      {rows.map(row => (
        <li
          key={row.variant_sku}
          className="border-border/70 flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
        >
          <span className="flex items-center gap-2.5">
            <span className="font-mono text-sm whitespace-nowrap">{row.variant_sku}</span>
            {/* The file's name, not a status: a Tag here would spend
                saturated colour on something that never changes. */}
            <span className="text-muted-foreground font-mono text-xs">{row.template_key}</span>
          </span>
          <Button
            variant="ghost"
            size="sm"
            disabled={busy}
            onClick={() => onRemove(row.variant_sku)}
          >
            Remove
          </Button>
        </li>
      ))}
    </ul>
  )
}

interface PreviewDesignFormProps {
  productCode: string
  variantSkus: string[]
  busy: boolean
  onAssign: (input: { templateKey: string; variantSku?: string }) => void
}

function PreviewDesignForm({
  productCode,
  variantSkus,
  busy,
  onAssign,
}: PreviewDesignFormProps): JSX.Element {
  const templates = useDesignTemplates()
  const [key, setKey] = useState('')
  const [sku, setSku] = useState('')

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${productCode}-preview-key`} className="text-xs">
          Design file
        </Label>
        <Input
          id={`${productCode}-preview-key`}
          list={`${productCode}-preview-templates`}
          value={key}
          onChange={event => setKey(event.target.value)}
          placeholder="pwdh_assembled"
          className="w-56"
        />
        <datalist id={`${productCode}-preview-templates`}>
          {templates.map(template => (
            <option key={template.key} value={template.key} />
          ))}
        </datalist>
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`${productCode}-preview-sku`} className="text-xs">
          Colourway
        </Label>
        {/* Every SKU by default: three colourways of one shape share one
            file, and uploading it per SKU is three chances to update two of
            them. */}
        <select
          id={`${productCode}-preview-sku`}
          value={sku}
          onChange={event => setSku(event.target.value)}
          className="border-border-strong bg-surface h-9 rounded-lg border px-2 text-sm"
        >
          <option value="">Every SKU</option>
          {variantSkus.map(variantSku => (
            <option key={variantSku} value={variantSku}>
              {variantSku}
            </option>
          ))}
        </select>
      </div>

      <Button
        disabled={busy || key.trim() === ''}
        onClick={() => onAssign({ templateKey: key.trim(), ...(sku ? { variantSku: sku } : {}) })}
      >
        Use this file
      </Button>
    </div>
  )
}
