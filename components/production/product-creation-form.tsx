'use client'

import { ImagePlus } from 'lucide-react'
import { useEffect, useState, type FormEvent, type JSX } from 'react'

import { BuildFirstResult } from '@/components/production/build-first-result'
import { ProductCreationResult } from '@/components/production/product-creation-result'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { buildProductFile, CREATABLE_PRODUCTS, saveBlob } from '@/lib/product-creation'

interface ProductCreationFormProps {
  brand: string
}

type Built = { product: string; order: string; url: string; filename: string }
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
    setBuilt({ product, order, url: URL.createObjectURL(res.blob), filename: res.filename })
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
          <Field label="Product" htmlFor="pc-product" hint={chosen?.hint}>
            <Select id="pc-product" value={product} onChange={e => setProduct(e.target.value)}>
              {CREATABLE_PRODUCTS.map(p => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field
            label="Order number"
            htmlFor="pc-order"
            hint="T3DPS-116597 or just 116597."
            required
          >
            <Input
              id="pc-order"
              value={orderNumber}
              onChange={e => setOrderNumber(e.target.value)}
              placeholder="116597"
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
            {pending === 'preview' ? 'Building… (fetching the photo)' : 'Submit'}
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
