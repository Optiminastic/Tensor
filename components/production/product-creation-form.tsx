'use client'

import { ImagePlus } from 'lucide-react'
import { useEffect, useState, type FormEvent, type JSX } from 'react'

import { Select, SelectItem } from '@/components/base/select/select'
import { BuildFirstResult } from '@/components/production/build-first-result'
import { ProductCreationResult } from '@/components/production/product-creation-result'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { buildProductFile, CREATABLE_PRODUCTS, saveBlob } from '@/lib/product-creation'
import type { PhotoSheetSummary } from '@/lib/validators/photo-sheet'

interface ProductCreationFormProps {
  brand: string
}

type Built = {
  product: string
  order: string
  url: string
  filename: string
  summary: PhotoSheetSummary | null
}
/** run remounts the result, so Submit again starts (or finds) the build again. */
type BuildFirst = { product: string; order: string; run: number }

/**
 * Choose a product, give an order number, get the print file.
 *
 * The PNG preview is built first and shown, because looking at it is the
 * check: a photo cropped through somebody's face is visible here and nowhere
 * else before it is printed. The print file - PDF or 3MF - is built on request
 * from the same order.
 */
export function ProductCreationForm({ brand }: ProductCreationFormProps): JSX.Element {
  const [product, setProduct] = useState<string>(CREATABLE_PRODUCTS[0]?.value ?? '')
  const [orderNumber, setOrderNumber] = useState('')
  const [pending, setPending] = useState<'preview' | 'download' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [built, setBuilt] = useState<Built | null>(null)
  const [buildFirst, setBuildFirst] = useState<BuildFirst | null>(null)

  // The preview is a blob URL; release it when it is replaced or the page goes.
  useEffect(() => () => (built ? URL.revokeObjectURL(built.url) : undefined), [built])

  const chosen = CREATABLE_PRODUCTS.find(p => p.value === product) ?? CREATABLE_PRODUCTS[0]
  const builtProduct = CREATABLE_PRODUCTS.find(p => p.value === built?.product)
  const buildFirstProduct = CREATABLE_PRODUCTS.find(p => p.value === buildFirst?.product)

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault()
    setError(null)
    const order = orderNumber.trim()
    if (chosen?.buildFirst) {
      // The picture comes from the finished model, so the build is the preview.
      setBuilt(null)
      setBuildFirst({ product, order, run: (buildFirst?.run ?? 0) + 1 })
      return
    }
    setBuildFirst(null)
    setPending('preview')
    const res = await buildProductFile(brand, product, { order_number: order, format: 'png' })
    setPending(null)
    if ('error' in res) {
      setError(res.error)
      return
    }
    setBuilt({
      product,
      order,
      url: URL.createObjectURL(res.blob),
      filename: res.filename,
      summary: res.summary,
    })
  }

  async function download(): Promise<void> {
    if (!built || !builtProduct) return
    setError(null)
    setPending('download')
    const res = await buildProductFile(brand, built.product, {
      order_number: built.order,
      format: builtProduct.download.format,
    })
    setPending(null)
    if ('error' in res) {
      setError(res.error)
      return
    }
    saveBlob(res.blob, res.filename)
  }

  return (
    <div className="flex w-full flex-col items-center gap-6">
      <Card className="w-full max-w-lg p-6">
        <form onSubmit={submit} className="flex flex-col gap-5">
          <Field label="Product" hint={chosen?.hint}>
            {/* The dashboard's own dropdown (as on the filter bars), not the
                browser's: the native list opened in the OS style, unlike
                every other picker in the product. */}
            <Select
              aria-label="Product"
              selectedKey={product}
              onSelectionChange={key => key !== null && setProduct(String(key))}
              className="w-full"
              triggerClassName="bg-surface border-border h-10 rounded-xl px-3 text-sm shadow-xs"
              popoverClassName="w-(--trigger-width)"
            >
              {CREATABLE_PRODUCTS.map(p => (
                <SelectItem key={p.value} id={p.value}>
                  {p.label}
                </SelectItem>
              ))}
            </Select>
          </Field>
          <Field
            label={chosen?.multiOrder ? 'Order numbers' : 'Order number'}
            htmlFor="pc-order"
            hint={
              chosen?.multiOrder
                ? 'Separate them with commas: 116324,115443,117584.'
                : 'T3DPS-116597 or just 116597.'
            }
            required
          >
            <Input
              id="pc-order"
              value={orderNumber}
              onChange={e => setOrderNumber(e.target.value)}
              placeholder={chosen?.multiOrder ? '116324,115443,117584' : '116597'}
              className="font-mono"
              autoComplete="off"
            />
          </Field>
          {error ? (
            <p role="alert" className="bg-danger-subtle text-danger rounded-2xl px-4 py-3 text-sm">
              {error}
            </p>
          ) : null}
          <Button type="submit" disabled={pending !== null || orderNumber.trim() === ''}>
            <ImagePlus className="size-4" aria-hidden />
            {pending === 'preview'
              ? chosen?.multiOrder
                ? 'Building… (fetching every photo)'
                : 'Building… (fetching the photo)'
              : 'Submit'}
          </Button>
        </form>
      </Card>

      {built && builtProduct ? (
        <ProductCreationResult
          brand={brand}
          product={builtProduct}
          order={built.order}
          previewUrl={built.url}
          previewName={built.filename}
          summary={built.summary}
          downloading={pending === 'download'}
          onDownload={() => void download()}
        />
      ) : null}

      {buildFirst && buildFirstProduct ? (
        <BuildFirstResult
          key={buildFirst.run}
          brand={brand}
          product={buildFirstProduct}
          order={buildFirst.order}
        />
      ) : null}
    </div>
  )
}
