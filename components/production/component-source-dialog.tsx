'use client'

import { Upload } from 'lucide-react'
import { useEffect, useRef, useState, type JSX } from 'react'

import {
  loadComponentPlates,
  setComponentSourceAction,
  uploadComponentModelAction,
} from '@/app/dashboard/[brand]/production/component-actions'
import { loadShopifyCatalogue } from '@/app/dashboard/[brand]/production/registry-actions'
import { ComponentPlateGrid, FAMILIES } from '@/components/production/component-plate-grid'
import { useDesignTemplates } from '@/components/production/design-templates-context'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import type {
  ComponentPlate,
  ComponentSource,
  InventoryItem,
  PlateScope,
} from '@/lib/validators/inventory'
import type { ShopifyProduct } from '@/lib/validators/shopify-products'

interface ComponentSourceDialogProps {
  brand: string
  item: InventoryItem
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * What a component is, and the files that print it.
 *
 * A component belongs to one product: you choose the product, its SKUs arrive
 * with it, and each SKU gets a finished file per machine class. Three
 * colourways on three machines is nine files, because a sliced file carries
 * the filament it was made with.
 *
 * Separate from InventoryItemDialog because it is a separate endpoint with a
 * different guard: the shelf - a name, a count, a price - is filament:manage,
 * the permission for loading spools. Deciding what a part IS and binding files
 * to it is a configuration act.
 */
export function ComponentSourceDialog({
  brand,
  item,
  open,
  onOpenChange,
}: ComponentSourceDialogProps): JSX.Element {
  const templates = useDesignTemplates()
  const [source, setSource] = useState<ComponentSource>(
    item.source === 'printed' ? 'printed' : 'bought',
  )
  const [templateKey, setTemplateKey] = useState(item.template_key ?? '')
  const [modelName, setModelName] = useState(item.model_file_id ? 'its own model' : '')
  const [catalogue, setCatalogue] = useState<ShopifyProduct[] | null>(null)
  const [productGID, setProductGID] = useState(item.shopify_product_gid ?? '')
  const [plates, setPlates] = useState<ComponentPlate[]>([])
  const [scope, setScope] = useState<PlateScope>((item.plate_scope as PlateScope) ?? 'per_sku')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const modelInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return
    setSource(item.source === 'printed' ? 'printed' : 'bought')
    setTemplateKey(item.template_key ?? '')
    setModelName(item.model_file_id ? 'its own model' : '')
    setProductGID(item.shopify_product_gid ?? '')
    setScope((item.plate_scope as PlateScope) ?? 'per_sku')
    setError(null)
    void loadComponentPlates(item.id).then(res => setPlates(res.ok && res.data ? res.data : []))
    // The LIVE catalogue, not the registry: a component can be declared for a
    // product nobody has imported yet, and the registry holds two of them.
    void loadShopifyCatalogue(brand).then(res => {
      setCatalogue(res.ok && res.data ? res.data : [])
      if (!res.ok) setError(res.error ?? 'Could not read the Shopify catalogue.')
    })
  }, [
    open,
    brand,
    item.id,
    item.source,
    item.template_key,
    item.model_file_id,
    item.shopify_product_gid,
    item.plate_scope,
  ])

  const product = (catalogue ?? []).find(p => p.id === productGID)
  const variants = (product?.variants ?? []).filter(v => v.sku !== '')

  async function uploadModel(file: File): Promise<void> {
    setBusy(true)
    setError(null)
    const form = new FormData()
    form.append('file', file)
    const res = await uploadComponentModelAction({ brand, id: item.id }, form)
    setBusy(false)
    if (!res.ok || !res.data) {
      setError(res.error ?? 'Could not store the model.')
      return
    }
    setModelName(res.data.model_filename || 'its own model')
    setTemplateKey('')
  }

  async function save(): Promise<void> {
    setBusy(true)
    setError(null)
    const res = await setComponentSourceAction(
      { brand, id: item.id },
      {
        source,
        template_key: source === 'printed' && templateKey !== '' ? templateKey : undefined,
        // Left to the backend when a model was uploaded here: that request
        // already set it, and sending a stale id would undo the upload.
        model_file_id:
          source === 'printed' && templateKey === '' && item.model_file_id
            ? item.model_file_id
            : undefined,
        shopify_product_gid: productGID !== '' ? productGID : undefined,
        shopify_product_title: product?.title,
        plate_scope: scope,
      },
    )
    setBusy(false)
    if (!res.ok) {
      setError(res.error ?? 'Could not save how this part is made.')
      return
    }
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{item.name}</DialogTitle>
          <DialogDescription>
            What this part is, and the files that print it. Choose the product it belongs to and
            each of its SKUs gets a file per machine.
          </DialogDescription>
        </DialogHeader>

        <div className="flex max-h-[70vh] flex-col gap-4 overflow-y-auto">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="component-product">Part of</Label>
            <Select
              id="component-product"
              value={productGID}
              disabled={busy || catalogue === null}
              onChange={e => setProductGID(e.target.value)}
            >
              <option value="">
                {catalogue === null ? 'Reading Shopify…' : 'Choose a product…'}
              </option>
              {(catalogue ?? []).map(p => (
                <option key={p.id} value={p.id}>
                  {p.title}
                </option>
              ))}
            </Select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="component-source">Made</Label>
            <Select
              id="component-source"
              value={source}
              disabled={busy}
              onChange={e => setSource(e.target.value as ComponentSource)}
            >
              <option value="bought">Bought in from a supplier</option>
              <option value="printed">Printed here</option>
            </Select>
          </div>

          {source === 'printed' ? (
            <div className="border-border flex flex-col gap-2 rounded-md border p-3">
              <div className="flex flex-col gap-0.5">
                <h3 className="text-sm font-medium">Design file</h3>
                <p className="text-muted-foreground text-xs">
                  What this part is. Upload its model, or point at a design file in the Designs tab
                  when the shape is parameterised.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="text-foreground truncate font-mono text-xs"
                  title={modelName || templateKey}
                >
                  {modelName !== '' ? modelName : templateKey !== '' ? templateKey : 'none yet'}
                </span>
                <input
                  ref={modelInput}
                  type="file"
                  accept=".stl,.3mf"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0]
                    if (file) void uploadModel(file)
                    e.target.value = ''
                  }}
                />
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={busy}
                  className="ml-auto"
                  onClick={() => modelInput.current?.click()}
                >
                  <Upload className="size-4" aria-hidden />
                  {modelName !== '' ? 'Replace model' : 'Upload model'}
                </Button>
              </div>
              <div className="flex flex-col gap-1.5 pt-1">
                <Label htmlFor="component-template" className="text-xs">
                  Or a design file from the registry
                </Label>
                <Select
                  id="component-template"
                  value={templateKey}
                  disabled={busy}
                  onChange={e => setTemplateKey(e.target.value)}
                >
                  <option value="">{modelName !== '' ? 'Its own model' : 'None'}</option>
                  {templates.map(t => (
                    <option key={t.key} value={t.key}>
                      {t.key}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          ) : null}

          {source === 'printed' ? (
            <div className="border-border rounded-md border p-3">
              <div className="mb-3 flex flex-col gap-1.5">
                <Label htmlFor="plate-scope">Does this part change with the colourway?</Label>
                <Select
                  id="plate-scope"
                  value={scope}
                  disabled={busy}
                  onChange={e => setScope(e.target.value as PlateScope)}
                >
                  <option value="shared">
                    No &mdash; the same file for every SKU ({FAMILIES.length} files)
                  </option>
                  <option value="per_sku">
                    Yes &mdash; a file per SKU (
                    {variants.length > 0 ? variants.length * FAMILIES.length : FAMILIES.length}{' '}
                    files)
                  </option>
                </Select>
                <p className="text-muted-foreground text-xs">
                  A plank&rsquo;s red heart is the same heart on every variant. A diya
                  holder&rsquo;s cup follows the colour it is sold in.
                </p>
              </div>

              {productGID === '' && scope === 'per_sku' ? (
                <p className="text-muted-foreground text-sm">
                  Choose the product above and its SKUs appear here, each with a file per machine.
                </p>
              ) : scope === 'per_sku' && variants.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  That product has no variants carrying a SKU, so there is nothing to address a file
                  to. Add SKUs in Shopify first.
                </p>
              ) : (
                <ComponentPlateGrid
                  brand={brand}
                  itemId={item.id}
                  variants={variants}
                  plates={plates}
                  scope={scope}
                  disabled={busy}
                  onChanged={setPlates}
                />
              )}
            </div>
          ) : null}

          {error ? (
            <p role="alert" className="bg-danger-subtle text-danger rounded-2xl px-4 py-3 text-sm">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <Button variant="ghost" disabled={busy} onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button disabled={busy} onClick={() => void save()}>
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
