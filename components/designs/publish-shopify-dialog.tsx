'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { ShoppingBag, X } from 'lucide-react'
import { useState, type JSX } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'

import { approveAndPublish } from '@/app/dashboard/[brand]/designs/actions'
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
import { Textarea } from '@/components/ui/textarea'

const MAX_IMAGES = 6

// Weight and dimensions are NOT entered here: Tensor derives the printed weight
// from the slice and the size from the model's bounding box, and the backend
// attaches them to the Shopify product. No one types physical facts.
const FormSchema = z.object({
  title: z.string().min(1, 'Give the product a title').max(255),
  price: z.number().int().positive('Price must be positive'),
  product_type: z.string().max(255),
  tags: z.string(),
  vendor: z.string().max(255),
  description: z.string().max(50_000),
  seo_title: z.string().max(255),
  seo_description: z.string().max(320),
})
type FormValues = z.infer<typeof FormSchema>

// The costing facts sent as Shopify metafields (namespace "tensor"), shown so the
// Project Lead knows what travels with the product.
const METAFIELDS = [
  'Design CP',
  'print time',
  'filament (g)',
  'dimensions (mm)',
  'units per bed',
  'effective machine time',
  'recommended SP',
  'material',
  'batchable',
]

interface PublishShopifyDialogProps {
  brand: string
  designId: string
  defaultTitle: string
  defaultPrice: number | null
  defaultSku?: string
  isApproved: boolean
  onPublished: () => void
}

/** Approve a priced design and create its Shopify draft product, with its
 * description, images, SEO and variant details filled in here. */
export function PublishShopifyDialog({
  brand,
  designId,
  defaultTitle,
  defaultPrice,
  defaultSku,
  isApproved,
  onPublished,
}: PublishShopifyDialogProps): JSX.Element {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [images, setImages] = useState<File[]>([])

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      title: defaultTitle,
      price: defaultPrice ?? 0,
      product_type: '',
      tags: '',
      vendor: '',
      description: '',
      seo_title: '',
      seo_description: '',
    },
  })

  function addImages(list: FileList | null): void {
    if (!list) return
    setImages(prev => {
      const merged = [...prev]
      for (const file of Array.from(list)) {
        const dup = merged.some(m => m.name === file.name && m.size === file.size)
        if (!dup) merged.push(file)
      }
      return merged.slice(0, MAX_IMAGES)
    })
  }

  function removeImage(index: number): void {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  async function onSubmit(values: FormValues): Promise<void> {
    setError(null)
    const tags = values.tags
      .split(',')
      .map(t => t.trim())
      .filter(Boolean)
    const outcome = await approveAndPublish(brand, designId, {
      input: {
        title: values.title,
        price: values.price,
        product_type: values.product_type || undefined,
        tags,
        vendor: values.vendor || undefined,
        description: values.description || undefined,
        seo_title: values.seo_title || undefined,
        seo_description: values.seo_description || undefined,
        // SKU, weight and dimensions are all system-derived: the backend stamps
        // the SKU, the printed weight (from the slice) and the model's dimensions
        // on the Shopify product automatically, so none are sent or edited here.
      },
      images,
    })
    // Refetch either way: on the "not connected" path the design is still approved.
    onPublished()
    if (!outcome.ok) {
      setError(outcome.error ?? 'Could not publish to Shopify.')
      return
    }
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="primary" size="sm">
          <ShoppingBag aria-hidden />
          {isApproved ? 'Push to Shopify' : 'Approve & push to Shopify'}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Approve &amp; push to Shopify</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <Field label="Title" htmlFor="title" required error={errors.title?.message}>
            <Input id="title" {...register('title')} />
          </Field>

          <Field label="Description" htmlFor="description" hint="Blank lines start new paragraphs">
            <Textarea id="description" rows={5} {...register('description')} />
          </Field>

          <Field
            label="Images"
            htmlFor="images"
            hint={`Up to ${MAX_IMAGES}. The first is featured.`}
          >
            <input
              id="images"
              type="file"
              accept="image/*"
              multiple
              onChange={e => {
                addImages(e.target.files)
                e.target.value = ''
              }}
              className="text-muted-foreground file:border-border file:bg-surface file:text-foreground hover:file:bg-surface-muted block w-full text-sm file:mr-3 file:cursor-pointer file:rounded-md file:border file:px-3 file:py-1.5 file:text-sm"
            />
          </Field>
          {images.length > 0 ? (
            <ul className="flex flex-col gap-1.5">
              {images.map((image, index) => (
                <li
                  key={`${image.name}-${image.size}`}
                  className="border-border flex items-center justify-between gap-3 rounded-md border px-3 py-2"
                >
                  <span className="text-foreground truncate text-sm">
                    {index === 0 ? '★ ' : ''}
                    {image.name}
                    <span className="text-subtle-foreground ml-2 font-mono text-xs">
                      {(image.size / 1024).toFixed(0)} KB
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    aria-label={`Remove ${image.name}`}
                    className="text-muted-foreground hover:text-foreground shrink-0"
                  >
                    <X className="size-4" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Price (₹)" htmlFor="price" error={errors.price?.message}>
              <Input
                id="price"
                type="number"
                step="1"
                data-numeric="true"
                {...register('price', { valueAsNumber: true })}
              />
            </Field>
            <Field label="Product type" htmlFor="product_type" hint="e.g. Desk decor">
              <Input id="product_type" {...register('product_type')} />
            </Field>
            <Field label="Tags" htmlFor="tags" hint="Comma-separated">
              <Input id="tags" placeholder="gifting, premium" {...register('tags')} />
            </Field>
            <Field label="Vendor" htmlFor="vendor" hint="Defaults to the brand">
              <Input id="vendor" {...register('vendor')} />
            </Field>
            <Field label="SKU" htmlFor="sku" hint="Auto-generated; pushed to Shopify">
              <Input
                id="sku"
                value={defaultSku ?? 'auto'}
                readOnly
                className="text-muted-foreground font-mono tabular-nums"
              />
            </Field>
            <Field label="Weight & size" htmlFor="derived-physical" hint="From the slice + model">
              <Input
                id="derived-physical"
                value="Set automatically from Tensor"
                readOnly
                className="text-muted-foreground"
              />
            </Field>
          </div>

          <div className="border-border flex flex-col gap-4 border-t pt-4">
            <Field label="SEO title" htmlFor="seo_title" hint="Defaults to the product title">
              <Input id="seo_title" {...register('seo_title')} />
            </Field>
            <Field
              label="SEO meta description"
              htmlFor="seo_description"
              hint="Up to 320 characters"
              error={errors.seo_description?.message}
            >
              <Textarea id="seo_description" rows={2} {...register('seo_description')} />
            </Field>
          </div>

          <p className="text-muted-foreground text-xs">
            Created as a <span className="font-medium">draft</span>. The variant weight (printed
            grams from the slice) and the model dimensions are set automatically. Metafields
            attached: {METAFIELDS.join(', ')}. You can still refine it in Shopify.
          </p>

          {error ? (
            <p role="alert" className="bg-danger-subtle text-danger rounded-md px-3 py-2 text-sm">
              {error}
            </p>
          ) : null}

          <Button type="submit" disabled={isSubmitting} className="self-start">
            {isSubmitting ? 'Publishing…' : 'Approve & push'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
