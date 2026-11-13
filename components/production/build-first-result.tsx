'use client'

import { Download, Loader2, RotateCcw } from 'lucide-react'
import { useEffect, type JSX } from 'react'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { useProductBuild } from '@/hooks/use-product-build'
import {
  type CreatableProduct,
  productBuildFileUrl,
  productBuildPreviewUrl,
} from '@/lib/product-creation'

interface BuildFirstResultProps {
  brand: string
  product: CreatableProduct
  order: string
}

/**
 * For a product whose picture can only be drawn from the finished model: the
 * build starts at once, and the preview and the 3MF appear together when it
 * lands - a second or two.
 */
export function BuildFirstResult({ brand, product, order }: BuildFirstResultProps): JSX.Element {
  const { build, error, starting, running, start } = useProductBuild(brand, product.value, order)

  useEffect(() => {
    void start()
  }, [start])

  const failed = build?.status === 'failed' || (error !== null && !running)
  return (
    <Card className="flex w-full max-w-5xl flex-col gap-4 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm">
          Order <span className="font-mono">{order}</span> — {product.check}
        </p>
        {build?.status === 'done' ? (
          <div className="flex gap-2">
            <a href={productBuildPreviewUrl(brand, build.id)} download className="contents">
              <Button type="button" variant="secondary">
                <Download className="size-4" aria-hidden /> Download PNG
              </Button>
            </a>
            <a
              href={productBuildFileUrl(brand, build.id)}
              download={build.filename}
              className="contents"
            >
              <Button type="button">
                <Download className="size-4" aria-hidden /> {product.download.label}
              </Button>
            </a>
          </div>
        ) : failed ? (
          <Button type="button" variant="secondary" onClick={() => void start()}>
            <RotateCcw className="size-4" aria-hidden /> Try again
          </Button>
        ) : (
          <p className="text-muted-foreground flex items-center gap-2 text-sm">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            {starting || build?.status !== 'building' ? 'Starting the build…' : 'Building…'}
          </p>
        )}
      </div>
      {failed ? (
        <p role="alert" className="bg-danger-subtle text-danger rounded-2xl px-4 py-3 text-sm">
          {build?.error ?? error}
        </p>
      ) : null}
      {build?.status === 'done' ? (
        // Drawn by the backend from the model; not a static asset next/image can optimise.
        <img
          src={productBuildPreviewUrl(brand, build.id)}
          alt={`${product.label} for order ${order}`}
          className="border-border w-full rounded-md border"
        />
      ) : null}
    </Card>
  )
}
