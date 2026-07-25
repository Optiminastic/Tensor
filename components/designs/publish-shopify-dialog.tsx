'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { ShoppingBag } from 'lucide-react'
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

const FormSchema = z.object({
  title: z.string().min(1, 'Give the product a title').max(255),
  price: z.number().int().positive('Price must be positive'),
  product_type: z.string().max(255),
  tags: z.string(),
  vendor: z.string().max(255),
})
type FormValues = z.infer<typeof FormSchema>

// The costing facts sent as Shopify metafields (namespace "tensor"), shown so the
// Project Lead knows what travels with the product.
const METAFIELDS = [
  'Design CP',
  'print time',
  'filament (g)',
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
  isApproved: boolean
  onPublished: () => void
}

/** Approve a priced design and create its Shopify draft product in one step. */
export function PublishShopifyDialog({
  brand,
  designId,
  defaultTitle,
  defaultPrice,
  isApproved,
  onPublished,
}: PublishShopifyDialogProps): JSX.Element {
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    },
  })

  async function onSubmit(values: FormValues): Promise<void> {
    setError(null)
    const tags = values.tags
      .split(',')
      .map(t => t.trim())
      .filter(Boolean)
    const outcome = await approveAndPublish(brand, designId, {
      title: values.title,
      price: values.price,
      product_type: values.product_type || undefined,
      tags,
      vendor: values.vendor || undefined,
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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Approve &amp; push to Shopify</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4" noValidate>
          <Field label="Title" htmlFor="title" required error={errors.title?.message}>
            <Input id="title" {...register('title')} />
          </Field>
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
          </div>

          <p className="text-muted-foreground text-xs">
            Created as a <span className="font-medium">draft</span>. Costing metafields attached:{' '}
            {METAFIELDS.join(', ')}. Finish images, description and variants in Shopify.
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
