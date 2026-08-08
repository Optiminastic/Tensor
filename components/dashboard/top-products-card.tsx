import type { JSX } from 'react'

import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { TopProduct } from '@/lib/dashboard/analytics'

interface TopProductsCardProps {
  products: TopProduct[]
}

interface ProductRowProps {
  product: TopProduct
  rank: number
  max: number
}

function ProductRow({ product, rank, max }: ProductRowProps): JSX.Element {
  const share = max ? (product.units / max) * 100 : 0
  return (
    <li className="flex items-center gap-4">
      <span className="bg-surface-muted text-subtle-foreground flex size-7 shrink-0 items-center justify-center rounded-full font-mono text-xs tabular-nums">
        {String(rank).padStart(2, '0')}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-foreground truncate text-sm">{product.name}</span>
          <span className="text-foreground shrink-0 font-mono text-sm tabular-nums">
            {product.units}
            <span className="text-subtle-foreground ml-1.5">units</span>
          </span>
        </div>
        <div className="bg-surface-muted h-1 w-full overflow-hidden rounded-full">
          <div
            className="bg-accent h-full rounded-full"
            style={{ width: `${Math.max(share, 3)}%` }}
            aria-hidden
          />
        </div>
      </div>
    </li>
  )
}

/** Products ranked by units in production - a numbered list with a hairline bar. */
export function TopProductsCard({ products }: TopProductsCardProps): JSX.Element {
  const max = products[0]?.units ?? 0
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>Top products</CardTitle>
        <CardDescription>By units in production.</CardDescription>
      </CardHeader>
      <div className="flex-1 px-5 py-5">
        {products.length === 0 ? (
          <p className="text-muted-foreground text-sm">No production jobs yet.</p>
        ) : (
          <ol className="flex flex-col gap-4">
            {products.map((product, index) => (
              <ProductRow key={product.name} product={product} rank={index + 1} max={max} />
            ))}
          </ol>
        )}
      </div>
    </Card>
  )
}
