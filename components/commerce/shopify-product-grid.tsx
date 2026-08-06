import { ShoppingBag } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import type { JSX } from 'react'

import type { ShopifyProduct } from '@/lib/validators/shopify-products'

import { ShopifyStatusPill } from './shopify-status-pill'

interface ShopifyProductGridProps {
  products: ShopifyProduct[]
}

function priceLabel(product: ShopifyProduct): string {
  const format = (amount: string): string =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: product.currency_code || 'USD',
      maximumFractionDigits: 2,
    }).format(Number(amount))
  return product.min_price === product.max_price
    ? format(product.min_price)
    : `${format(product.min_price)} – ${format(product.max_price)}`
}

/** A brand's live Shopify catalog as a cover-image grid, each card linking to the product in Shopify admin. */
export function ShopifyProductGrid({ products }: ShopifyProductGridProps): JSX.Element {
  return (
    <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {products.map(product => (
        <li key={product.id}>
          <Link
            href={product.admin_url}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex flex-col gap-2"
          >
            <div className="border-border bg-surface-muted relative aspect-square overflow-hidden rounded-lg border">
              {product.image_url ? (
                <Image
                  src={product.image_url}
                  alt={product.image_alt}
                  fill
                  unoptimized
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  className="object-cover transition-transform duration-200 group-hover:scale-105"
                />
              ) : (
                <div className="text-subtle-foreground flex h-full items-center justify-center">
                  <ShoppingBag className="size-8" aria-hidden />
                </div>
              )}
              <span className="absolute top-2 left-2">
                <ShopifyStatusPill status={product.status} />
              </span>
            </div>
            <div className="min-w-0">
              <p className="text-foreground truncate text-sm font-medium">{product.title}</p>
              <p className="text-muted-foreground truncate font-mono text-xs tabular-nums">
                {priceLabel(product)}
              </p>
              <p className="text-subtle-foreground truncate font-mono text-xs tabular-nums">
                {product.total_inventory} in stock
              </p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  )
}
