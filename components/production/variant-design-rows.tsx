'use client'

import { useRouter } from 'next/navigation'
import { useState, type JSX } from 'react'

import {
  assignPreviewDesign,
  removePreviewDesign,
} from '@/app/dashboard/[brand]/production/design-fields-actions'
import { assignVariantDesign } from '@/app/dashboard/[brand]/production/registry-actions'
import { useDesignTemplates } from '@/components/production/design-templates-context'
import { VariantFieldMapDialog } from '@/components/production/variant-field-map-dialog'
import { Select } from '@/components/ui/select'
import { Tag } from '@/components/ui/tag'
import { templateLabel, templatesForSection } from '@/lib/template-sections'
import type { RegistryVariant } from '@/lib/validators/registry'

interface VariantDesignRowsProps {
  brand: string
  productCode: string
  role: string
  variants: RegistryVariant[]
  /** Which file each SKU's preview is drawn from, by SKU. */
  previewBySKU: Record<string, string>
  /** The product-wide file, shown as what a row inherits. */
  productTemplate: string
  onChanged: () => void
}

/**
 * The file each child SKU prints from, and the one its customer is shown.
 *
 * WHY PER SKU AT ALL. A product used to name one file and express its
 * colourways as colour schemes — a scheme per variant naming each piece the
 * file draws and the filament it prints in. That fits a plank, where twenty
 * SKUs are one geometry differing by filament. It fits the Diwali products
 * badly: three colourways whose back, outline, text and cup are three
 * different palettes is nine rows typed by hand, and every new product is nine
 * more. Giving each SKU its own .scad, with its colours already in it, is the
 * shop's own answer.
 *
 * INHERITANCE IS THE DEFAULT AND STAYS. "Follow the product" is the first
 * option on every row, and it is what keeps a twenty-SKU plank a single
 * choice rather than twenty — which is exactly what the product-wide picker
 * above this was written to protect, and the reason it is still there.
 */
export function VariantDesignRows({
  brand,
  productCode,
  role,
  variants,
  previewBySKU,
  productTemplate,
  onChanged,
}: VariantDesignRowsProps): JSX.Element {
  const templates = useDesignTemplates()
  const active = variants.filter(v => (v.sku ?? '').trim() !== '' && v.status !== 'retired')

  if (active.length === 0) {
    return (
      <p className="text-muted-foreground text-sm">
        None of this product&rsquo;s SKUs carries a code, so there is nothing an order could be
        matched to. Add them in Shopify, then import the product again.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <h3 className="text-sm font-medium">Each SKU</h3>
        <p className="text-muted-foreground text-xs text-pretty">
          A SKU that follows the product needs nothing here. One that prints from its own file names
          it, and maps the order&rsquo;s fields to that file&rsquo;s variables.
        </p>
      </div>

      <ul className="divide-border/70 divide-y">
        {active.map(variant => (
          <VariantRow
            key={variant.id}
            brand={brand}
            productCode={productCode}
            role={role}
            variant={variant}
            templates={templates}
            previewKey={previewBySKU[(variant.sku ?? '').trim()] ?? ''}
            productTemplate={productTemplate}
            onChanged={onChanged}
          />
        ))}
      </ul>
    </div>
  )
}

interface VariantRowProps {
  brand: string
  productCode: string
  role: string
  variant: RegistryVariant
  templates: ReturnType<typeof useDesignTemplates>
  previewKey: string
  productTemplate: string
  onChanged: () => void
}

/** One SKU: what it prints from, what it shows, and how its fields are mapped. */
function VariantRow({
  brand,
  productCode,
  role,
  variant,
  templates,
  previewKey,
  productTemplate,
  onChanged,
}: VariantRowProps): JSX.Element {
  const router = useRouter()
  const sku = (variant.sku ?? '').trim()
  // The row's own file, or "" when it follows the product. variant.design is
  // the active row for this role, which the backend resolves per variant.
  const own = variant.design?.role === role ? (variant.design.template_key ?? '') : ''
  const [printing, setPrinting] = useState(own)
  const [preview, setPreview] = useState(previewKey)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function run(what: () => Promise<{ ok: boolean; error?: string }>): Promise<boolean> {
    setBusy(true)
    setError(null)
    const res = await what()
    setBusy(false)
    if (!res.ok) {
      setError(res.error ?? 'Could not save that.')
      return false
    }
    onChanged()
    router.refresh()
    return true
  }

  async function choosePrinting(key: string): Promise<void> {
    const previous = printing
    setPrinting(key)
    // EMPTY CLEARS THIS SKU'S OWN FILE, which is a real state and not a
    // refusal: it is how one colourway stops using a file so the file can be
    // removed, and how a SKU goes back to whatever its siblings print from.
    if (!(await run(() => assignVariantDesign(brand, variant.id, { role, template_key: key })))) {
      setPrinting(previous)
    }
  }

  async function choosePreview(key: string): Promise<void> {
    const previous = preview
    setPreview(key)
    const ok = await run(() =>
      key === ''
        ? removePreviewDesign(brand, productCode, sku)
        : assignPreviewDesign(brand, productCode, { templateKey: key, variantSku: sku }),
    )
    if (!ok) setPreview(previous)
  }

  return (
    <li className="flex flex-col gap-2 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-sm">{sku}</span>
        <span className="text-muted-foreground text-sm">{variant.name}</span>
        {own === '' ? (
          <Tag tone="muted">Follows the product</Tag>
        ) : (
          <Tag tone="accent">Its own file</Tag>
        )}
      </div>

      <div className="flex flex-wrap items-end gap-2">
        <label className="flex min-w-56 flex-1 flex-col gap-1">
          <span className="text-muted-foreground text-xs">Prints from</span>
          <Select
            value={printing}
            disabled={busy}
            onChange={e => void choosePrinting(e.target.value)}
          >
            <option value="">
              {productTemplate === ''
                ? 'Nothing prints this'
                : `Follow the product — ${productTemplate}`}
            </option>
            {templatesForSection(templates, 'print', printing).map(t => (
              <option key={t.key} value={t.key}>
                {templateLabel(t)}
              </option>
            ))}
          </Select>
        </label>

        {/* The file the customer approves, which is not the file that prints.
            Cleared back to none is a real state: the link then shows the
            model that will be made. */}
        <label className="flex min-w-56 flex-1 flex-col gap-1">
          <span className="text-muted-foreground text-xs">Customer sees</span>
          <Select
            value={preview}
            disabled={busy}
            onChange={e => void choosePreview(e.target.value)}
          >
            <option value="">The model that prints</option>
            {templatesForSection(templates, 'preview', preview).map(t => (
              <option key={t.key} value={t.key}>
                {templateLabel(t)}
              </option>
            ))}
          </Select>
        </label>

        <VariantFieldMapDialog
          brand={brand}
          productCode={productCode}
          role={role}
          variant={variant}
          templateKey={printing === '' ? productTemplate : printing}
          onChanged={onChanged}
        />
      </div>

      {error ? (
        <p role="alert" className="text-danger text-xs text-pretty">
          {error}
        </p>
      ) : null}
    </li>
  )
}
