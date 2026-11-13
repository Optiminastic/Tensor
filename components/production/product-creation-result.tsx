'use client'

import { Box, Download, FileText } from 'lucide-react'
import type { JSX } from 'react'

import { BackgroundBuildButton } from '@/components/production/background-build-button'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { CreatableProduct } from '@/lib/product-creation'

interface ProductCreationResultProps {
  brand: string
  product: CreatableProduct
  order: string
  previewUrl: string
  previewName: string
  downloading: boolean
  onDownload: () => void
}

/** The built preview, with the PNG and the print file to download. */
export function ProductCreationResult({
  brand,
  product,
  order,
  previewUrl,
  previewName,
  downloading,
  onDownload,
}: ProductCreationResultProps): JSX.Element {
  const Icon = product.download.format === '3mf' ? Box : FileText
  return (
    <Card className="flex w-full max-w-5xl flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm">
          Order <span className="font-mono">{order}</span> — {product.check}
        </p>
        <div className="flex gap-2">
          <a href={previewUrl} download={previewName} className="contents">
            <Button type="button" variant="secondary">
              <Download className="size-4" aria-hidden /> Download PNG
            </Button>
          </a>
          {product.download.background ? (
            <BackgroundBuildButton
              brand={brand}
              product={product.value}
              order={order}
              label={product.download.label}
            />
          ) : (
            <Button type="button" onClick={onDownload} disabled={downloading}>
              <Icon className="size-4" aria-hidden />
              {downloading ? 'Building…' : product.download.label}
            </Button>
          )}
        </div>
      </div>
      {/* A blob URL from the backend, not a static asset next/image can optimise. */}
      <img
        src={previewUrl}
        alt={`${product.label} for order ${order}`}
        className="border-border w-full rounded-md border"
      />
    </Card>
  )
}
