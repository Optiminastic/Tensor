'use client'

import { ArrowLeft, ShoppingBag } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useCallback, useEffect, useState, type JSX } from 'react'

import { loadShopifyCatalog } from '@/app/dashboard/[brand]/designs/shopify-actions'
import { DesignUploadForm, type ShopifyImportSource } from '@/components/designs/design-upload-form'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { ShopifyProduct } from '@/lib/validators/shopify-products'

interface ShopifyImportDialogProps {
  brand: string
}

// formatPriceRange renders the listing's price with its currency, collapsing a
// single-price product to one figure.
function formatPriceRange(product: ShopifyProduct): string {
  const min = Number(product.min_price)
  const max = Number(product.max_price)
  const one = (n: number, fallback: string): string =>
    Number.isFinite(n) ? n.toLocaleString('en-IN', { maximumFractionDigits: 2 }) : fallback
  const label =
    Number.isFinite(min) && Number.isFinite(max) && max !== min
      ? `${one(min, product.min_price)} - ${one(max, product.max_price)}`
      : one(min || max, product.min_price)
  return product.currency_code ? `${product.currency_code} ${label}` : label
}

function toImportSource(product: ShopifyProduct): ShopifyImportSource {
  return {
    product_gid: product.id,
    handle: product.handle,
    admin_url: product.admin_url,
    image_url: product.image_url,
    min_price: product.min_price,
    max_price: product.max_price,
    currency: product.currency_code,
  }
}

/**
 * Import an existing Shopify product into a design. Step 1 lists the brand's live
 * catalog; step 2 opens the normal upload form pre-filled from the chosen listing
 * (name + cover photo), so the STL rides in and the usual slice/price pipeline runs.
 */
export function ShopifyImportDialog({ brand }: ShopifyImportDialogProps): JSX.Element {
  const [open, setOpen] = useState(false)
  const [products, setProducts] = useState<ShopifyProduct[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [selected, setSelected] = useState<ShopifyProduct | null>(null)

  const fetchCatalog = useCallback(async (): Promise<void> => {
    setError(null)
    setProducts(null)
    const outcome = await loadShopifyCatalog(brand)
    if (outcome.ok && outcome.data) {
      setProducts(outcome.data)
      return
    }
    setError(outcome.error ?? 'Could not load the Shopify catalog.')
  }, [brand])

  useEffect(() => {
    if (open) {
      setSelected(null)
      void fetchCatalog()
    }
  }, [open, fetchCatalog])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary">
          <ShoppingBag aria-hidden />
          Shopify
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {selected ? `Import "${selected.title}"` : 'Import a Shopify product'}
          </DialogTitle>
        </DialogHeader>
        {selected ? (
          <div className="flex flex-col gap-4">
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="text-muted-foreground hover:text-foreground flex items-center gap-1 self-start text-sm"
            >
              <ArrowLeft className="size-4" aria-hidden />
              Choose a different product
            </button>
            <DesignUploadForm
              brand={brand}
              defaultName={selected.title}
              shopify={toImportSource(selected)}
              onDone={() => setOpen(false)}
            />
          </div>
        ) : (
          <CatalogPicker
            brand={brand}
            products={products}
            error={error}
            onRetry={() => void fetchCatalog()}
            onSelect={setSelected}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}

interface CatalogPickerProps {
  brand: string
  products: ShopifyProduct[] | null
  error: string | null
  onRetry: () => void
  onSelect: (product: ShopifyProduct) => void
}

// CatalogPicker renders the loading / error / empty / list states for step 1.
function CatalogPicker({
  brand,
  products,
  error,
  onRetry,
  onSelect,
}: CatalogPickerProps): JSX.Element {
  if (error) {
    return (
      <div className="flex flex-col gap-3">
        <p role="alert" className="bg-danger-subtle text-danger rounded-md px-3 py-2 text-sm">
          {error}
        </p>
        <div className="flex items-center gap-3">
          <Button variant="secondary" size="sm" onClick={onRetry}>
            Try again
          </Button>
          <Link
            href={`/dashboard/${brand}/integrations`}
            className="text-accent text-sm hover:underline"
          >
            Manage integrations
          </Link>
        </div>
      </div>
    )
  }
  if (!products) {
    return <p className="text-muted-foreground py-8 text-center text-sm">Loading the catalog…</p>
  }
  if (products.length === 0) {
    return (
      <p className="text-muted-foreground py-8 text-center text-sm">
        This store has no products yet.
      </p>
    )
  }
  return (
    <ul className="flex flex-col gap-2">
      {products.map(product => (
        <li key={product.id}>
          <button
            type="button"
            onClick={() => onSelect(product)}
            className="border-border hover:border-border-strong hover:bg-surface-muted flex w-full items-center gap-3 rounded-md border px-3 py-2 text-left transition-colors"
          >
            <ProductThumb product={product} />
            <span className="min-w-0 flex-1">
              <span className="text-foreground block truncate text-sm font-medium">
                {product.title}
              </span>
              <span className="text-subtle-foreground font-mono text-xs tabular-nums">
                {formatPriceRange(product)}
              </span>
            </span>
            <span className="text-subtle-foreground text-xs tracking-wide uppercase">
              {product.status}
            </span>
          </button>
        </li>
      ))}
    </ul>
  )
}

// ProductThumb shows the listing photo, or a monogram when it has none.
function ProductThumb({ product }: { product: ShopifyProduct }): JSX.Element {
  if (product.image_url) {
    return (
      <span className="border-border bg-surface-muted relative size-11 shrink-0 overflow-hidden rounded-md border">
        <Image src={product.image_url} alt="" fill sizes="44px" className="object-cover" />
      </span>
    )
  }
  return (
    <span className="border-border bg-surface-muted text-subtle-foreground flex size-11 shrink-0 items-center justify-center rounded-md border text-sm font-medium">
      {product.title.trim().charAt(0).toUpperCase() || '#'}
    </span>
  )
}
