'use client'

import { SlidersHorizontal } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, type JSX } from 'react'

import {
  loadDesignFields,
  loadVariantFieldMaps,
  removeVariantFieldMaps,
  saveVariantFieldMapsAction,
} from '@/app/dashboard/[brand]/production/design-fields-actions'
import { FieldMapEditor } from '@/components/production/field-map-editor'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type {
  FieldMap,
  ObservedProperty,
  RegistryVariant,
  TemplateParam,
} from '@/lib/validators/registry'

interface VariantFieldMapDialogProps {
  brand: string
  productCode: string
  role: string
  variant: RegistryVariant
  /** The file this SKU actually renders from — its own, or the product's. */
  templateKey: string
  onChanged: () => void
}

/**
 * How one SKU's order fields fill its own file's variables.
 *
 * THE SAME EDITOR THE PRODUCT USES, in a dialog, with its save pointed at this
 * SKU. Reusing it is the point: the five refusals that make a mapping
 * renderable — a variable that must be named, no duplicates, no default on a
 * required field, no character limit on a fixed value — are one set of rules,
 * and a second editor would be a second set to keep in step.
 *
 * AN OVERRIDE REPLACES THE PRODUCT'S MAPPING WHOLE, never merges with it. A
 * half-override is a mapping that exists in neither place and that nobody
 * chose, which is the same rule colour schemes follow and for the same reason.
 * So "use the product's mapping again" is its own control rather than an empty
 * list — saved empty, it would read back as no override at all.
 *
 * The variables offered are read from the file THIS SKU renders from, which is
 * the whole reason a per-SKU mapping exists: a Royal's assembled file may call
 * the name NAME where the plate calls it TEXT.
 */
export function VariantFieldMapDialog({
  brand,
  productCode,
  role,
  variant,
  templateKey,
  onChanged,
}: VariantFieldMapDialogProps): JSX.Element {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [own, setOwn] = useState<FieldMap[] | null>(null)
  const [params, setParams] = useState<TemplateParam[]>([])
  const [properties, setProperties] = useState<ObservedProperty[]>([])

  // Loaded when it opens, not with the page: most SKUs inherit, and reading
  // every override up front is work for rows nobody opens.
  useEffect(() => {
    if (!open) return
    let live = true
    setError(null)
    void loadVariantFieldMaps(variant.id, role).then(res => {
      if (live) setOwn(res.ok && res.data ? res.data : [])
    })
    // The file's variables and what customers have actually sent, both of
    // which the product-level loader already answers.
    void loadDesignFields(brand, productCode, { role, template_key: templateKey }).then(res => {
      if (!live || !res.ok || !res.data) return
      setParams(res.data.params)
      setProperties(res.data.properties)
    })
    return () => {
      live = false
    }
  }, [open, brand, productCode, role, templateKey, variant.id])

  async function followTheProduct(): Promise<void> {
    setBusy(true)
    setError(null)
    const res = await removeVariantFieldMaps(brand, variant.id, role)
    setBusy(false)
    if (!res.ok) {
      setError(res.error ?? 'Could not remove this SKU’s mapping.')
      return
    }
    setOpen(false)
    onChanged()
    router.refresh()
  }

  const sku = (variant.sku ?? '').trim()
  const overridden = (own?.length ?? 0) > 0

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          <SlidersHorizontal className="size-3.5" aria-hidden />
          Map fields
          {overridden ? null : <span className="text-subtle-foreground text-xs">inherited</span>}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{sku}</DialogTitle>
          <DialogDescription>
            Which of the order&rsquo;s fields fills which variable of{' '}
            <span className="font-mono text-xs">{templateKey || 'this SKU’s file'}</span>. Saving
            here replaces the product&rsquo;s mapping for this SKU entirely.
          </DialogDescription>
        </DialogHeader>

        {own === null ? (
          <p className="text-muted-foreground text-sm">Loading…</p>
        ) : (
          <FieldMapEditor
            brand={brand}
            productCode={productCode}
            role={role}
            properties={properties}
            params={params}
            maps={own}
            onSaved={() => {
              onChanged()
              router.refresh()
            }}
            onSave={maps => saveVariantFieldMapsAction(brand, variant.id, { role, maps })}
          />
        )}

        {error ? (
          <p role="alert" className="bg-danger-subtle text-danger rounded-2xl px-4 py-3 text-sm">
            {error}
          </p>
        ) : null}

        {overridden ? (
          <div className="border-border/70 mt-4 flex flex-wrap items-center gap-3 border-t pt-4">
            <Button
              variant="ghost"
              size="sm"
              disabled={busy}
              onClick={() => void followTheProduct()}
            >
              Use the product&rsquo;s mapping
            </Button>
            <span className="text-muted-foreground text-xs text-pretty">
              Removes this SKU&rsquo;s own fields, so it follows the product again.
            </span>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}
