'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { ExternalLink, Pencil } from 'lucide-react'
import { useCallback, useEffect, useState, type JSX } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import {
  loadShopifyListing,
  updateShopifyListing,
} from '@/app/dashboard/[brand]/designs/shopify-actions'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  type ShopifyListingEdit,
  type ShopifyListingState,
  ShopifyListingStatusSchema,
} from '@/lib/validators/shopify-listing'

import { ListingImages } from './edit-shopify-images'

const MAX_NEW_IMAGES = 6

// The form mirrors ShopifyListingEdit but keeps tags as the raw comma string the
// user types and price as a plain number (0 means "leave the price unchanged").
// inventory_quantity is only pushed when the merchant changes it (see onSubmit),
// so an unrelated edit never silently flips a product to inventory-tracked.
const FormSchema = z.object({
  title: z.string().min(1, 'Give the product a title').max(255),
  description: z.string().max(50_000),
  status: ShopifyListingStatusSchema,
  price: z.number().int().nonnegative(),
  inventory_quantity: z.number().int().nonnegative().max(1_000_000),
  product_type: z.string().max(255),
  tags: z.string(),
  vendor: z.string().max(255),
  seo_title: z.string().max(255),
  seo_description: z.string().max(320),
})
type FormValues = z.infer<typeof FormSchema>

interface EditShopifyListingDialogProps {
  brand: string
  designId: string
  onSaved: () => void
}

/**
 * Edits an already-published Shopify listing. Opening the dialog reads the live
 * product to prefill the form, so the merchant edits from the current values;
 * saving pushes the edits (and an optional new price/status) immediately. Images
 * and inventory quantity are still managed in Shopify - the admin link opens them.
 */
export function EditShopifyListingDialog({
  brand,
  designId,
  onSaved,
}: EditShopifyListingDialogProps): JSX.Element {
  const [open, setOpen] = useState(false)
  const [state, setState] = useState<ShopifyListingState | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  const fetchState = useCallback(async (): Promise<void> => {
    setLoadError(null)
    setState(null)
    const outcome = await loadShopifyListing(designId)
    if (outcome.ok && outcome.data) {
      setState(outcome.data)
      return
    }
    setLoadError(outcome.error ?? 'Could not load the Shopify listing.')
  }, [designId])

  useEffect(() => {
    if (open) void fetchState()
  }, [open, fetchState])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          <Pencil aria-hidden />
          Edit listing
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Shopify listing</DialogTitle>
        </DialogHeader>
        {loadError ? (
          <div className="flex flex-col gap-3">
            <p role="alert" className="bg-danger-subtle text-danger rounded-md px-3 py-2 text-sm">
              {loadError}
            </p>
            <Button
              variant="secondary"
              size="sm"
              className="self-start"
              onClick={() => void fetchState()}
            >
              Try again
            </Button>
          </div>
        ) : state ? (
          <ListingEditForm
            brand={brand}
            designId={designId}
            state={state}
            onDone={() => {
              setOpen(false)
              onSaved()
            }}
          />
        ) : (
          <p className="text-muted-foreground py-8 text-center text-sm">
            Loading the live listing…
          </p>
        )}
      </DialogContent>
    </Dialog>
  )
}

interface ListingEditFormProps {
  brand: string
  designId: string
  state: ShopifyListingState
  onDone: () => void
}

// Renders once the live state is loaded, so RHF's defaultValues are the current
// Shopify values. Kept separate from the dialog so the fetch/loading concern and
// the form concern do not tangle.
function ListingEditForm({ brand, designId, state, onDone }: ListingEditFormProps): JSX.Element {
  const [error, setError] = useState<string | null>(null)
  const [newImages, setNewImages] = useState<File[]>([])
  const [removedIds, setRemovedIds] = useState<string[]>([])
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      title: state.title,
      description: state.description,
      status: state.status,
      price: state.price,
      inventory_quantity: state.inventory_quantity,
      product_type: state.product_type,
      tags: state.tags.join(', '),
      vendor: state.vendor,
      seo_title: state.seo_title,
      seo_description: state.seo_description,
    },
  })

  function addFiles(list: FileList | null): void {
    if (!list) return
    setNewImages(prev => {
      const merged = [...prev]
      for (const file of Array.from(list)) {
        if (!merged.some(m => m.name === file.name && m.size === file.size)) merged.push(file)
      }
      return merged.slice(0, MAX_NEW_IMAGES)
    })
  }

  function toggleExisting(id: string): void {
    setRemovedIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]))
  }

  async function onSubmit(values: FormValues): Promise<void> {
    setError(null)
    const tags = values.tags
      .split(',')
      .map(t => t.trim())
      .filter(Boolean)
    const input: ShopifyListingEdit = {
      title: values.title,
      description: values.description,
      product_type: values.product_type,
      vendor: values.vendor,
      tags,
      status: values.status,
      seo_title: values.seo_title,
      seo_description: values.seo_description,
      price: values.price > 0 ? values.price : undefined,
      // Only push stock when it actually changed, so a title-only edit never
      // flips the product to inventory-tracked.
      inventory_quantity:
        values.inventory_quantity !== state.inventory_quantity
          ? values.inventory_quantity
          : undefined,
    }
    const outcome = await updateShopifyListing(brand, designId, {
      input,
      images: newImages,
      removeMediaIds: removedIds,
    })
    if (!outcome.ok) {
      setError(outcome.error ?? 'Could not update the Shopify listing.')
      return
    }
    onDone()
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
      <Field label="Title" htmlFor="edit-title" required error={errors.title?.message}>
        <Input id="edit-title" {...register('title')} />
      </Field>

      <Field label="Description" htmlFor="edit-description" hint="Blank lines start new paragraphs">
        <Textarea id="edit-description" rows={5} {...register('description')} />
      </Field>

      <ListingImages
        existing={state.images}
        removedIds={removedIds}
        onToggleExisting={toggleExisting}
        newImages={newImages}
        onAddFiles={addFiles}
        onRemoveNew={index => setNewImages(prev => prev.filter((_, i) => i !== index))}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Status" htmlFor="edit-status" hint="Live on the storefront when Active">
          <Select id="edit-status" {...register('status')}>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </Select>
        </Field>
        <Field label="Price (₹)" htmlFor="edit-price" error={errors.price?.message}>
          <Input
            id="edit-price"
            type="number"
            step="1"
            data-numeric="true"
            {...register('price', { valueAsNumber: true })}
          />
        </Field>
        <Field
          label="Stock"
          htmlFor="edit-stock"
          hint="On-hand quantity"
          error={errors.inventory_quantity?.message}
        >
          <Input
            id="edit-stock"
            type="number"
            step="1"
            min="0"
            data-numeric="true"
            {...register('inventory_quantity', { valueAsNumber: true })}
          />
        </Field>
        <Field label="Product type" htmlFor="edit-product-type" hint="e.g. Desk decor">
          <Input id="edit-product-type" {...register('product_type')} />
        </Field>
        <Field label="Vendor" htmlFor="edit-vendor" hint="Defaults to the brand">
          <Input id="edit-vendor" {...register('vendor')} />
        </Field>
        <Field label="Tags" htmlFor="edit-tags" hint="Comma-separated">
          <Input id="edit-tags" placeholder="gifting, premium" {...register('tags')} />
        </Field>
        <Field label="SKU" htmlFor="edit-sku" hint="Managed on the design">
          <Input
            id="edit-sku"
            value={state.sku || 'auto'}
            readOnly
            className="text-muted-foreground font-mono tabular-nums"
          />
        </Field>
      </div>

      <div className="border-border flex flex-col gap-4 border-t pt-4">
        <Field label="SEO title" htmlFor="edit-seo-title" hint="Defaults to the product title">
          <Input id="edit-seo-title" {...register('seo_title')} />
        </Field>
        <Field
          label="SEO meta description"
          htmlFor="edit-seo-description"
          hint="Up to 320 characters"
          error={errors.seo_description?.message}
        >
          <Textarea id="edit-seo-description" rows={2} {...register('seo_description')} />
        </Field>
      </div>

      <p className="text-muted-foreground text-xs">
        Changes push to Shopify on save. For anything not shown here,{' '}
        <a
          href={state.admin_url}
          target="_blank"
          rel="noreferrer"
          className="text-accent inline-flex items-center gap-1 hover:underline"
        >
          open in Shopify
          <ExternalLink className="size-3" aria-hidden />
        </a>
        .
      </p>

      {error ? (
        <p role="alert" className="bg-danger-subtle text-danger rounded-md px-3 py-2 text-sm">
          {error}
        </p>
      ) : null}

      <Button type="submit" disabled={isSubmitting} className="self-start">
        {isSubmitting ? 'Saving…' : 'Save changes'}
      </Button>
    </form>
  )
}
