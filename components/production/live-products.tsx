import Link from 'next/link'
import type { JSX } from 'react'

import { Badge } from '@/components/ui/badge'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

/** A brand's published product, flattened from its design detail for the list. */
export interface LiveProduct {
  id: string
  name: string
  material: string
  quality: string
  price: number | null
  shopifyUrl: string | null
}

interface LiveProductsProps {
  brand: string
  products: LiveProduct[]
}

function inr(value: number): string {
  return `₹${value.toLocaleString('en-IN')}`
}

/** The brand's live (published-to-Shopify) products, each linking to its design
 * detail and its Shopify product. */
export function LiveProducts({ brand, products }: LiveProductsProps): JSX.Element {
  if (products.length === 0) {
    return (
      <Card>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            No live products yet. Approve a design and publish it to Shopify, and it appears here.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-0">
        <ul className="divide-border divide-y">
          {products.map(product => (
            <li key={product.id} className="flex items-center justify-between gap-4 px-4 py-3">
              <div className="min-w-0">
                <Link
                  href={`/dashboard/${brand}/designs/${product.id}`}
                  className="text-foreground truncate text-sm font-medium hover:underline"
                >
                  {product.name}
                </Link>
                <p className="text-muted-foreground font-mono text-xs tabular-nums">
                  {product.material} / {product.quality}
                  {product.price !== null ? ` / ${inr(product.price)}` : ''}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <Badge tone="success">Published</Badge>
                {product.shopifyUrl ? (
                  <a
                    href={product.shopifyUrl}
                    target="_blank"
                    rel="noreferrer"
                    className={buttonVariants({ variant: 'secondary', size: 'sm' })}
                  >
                    Open in Shopify
                  </a>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
