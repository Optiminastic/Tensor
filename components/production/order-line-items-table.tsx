import { ShoppingBag } from 'lucide-react'
import Image from 'next/image'
import type { JSX } from 'react'

import type { LineProp, OrderLineItem, OrderProduct } from '@/components/production/types'
import { Card, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/table'

interface OrderLineItemsTableProps {
  products: OrderProduct[]
  // Fallback for an order with no order_line_items rows yet (older imports).
  lineItems: OrderLineItem[]
}

function ProductThumb({ url, alt }: { url: string | null; alt: string }): JSX.Element {
  if (!url) {
    return (
      <div className="border-border bg-surface-muted text-subtle-foreground flex size-10 items-center justify-center rounded-md border">
        <ShoppingBag className="size-4" aria-hidden />
      </div>
    )
  }
  return (
    <Image
      src={url}
      alt={alt}
      width={40}
      height={40}
      unoptimized
      className="border-border size-10 rounded-md border object-cover"
    />
  )
}

/**
 * What the customer filled in, shown under the line it belongs to.
 *
 * This is the whole reason the order is in Tensor: somebody has to engrave
 * "RAHUL & RANU" onto a plank, and until now these attributes were fetched
 * from Shopify and thrown away because their names did not match a hardcoded
 * list. Showing them verbatim means an unrecognised question still reaches the
 * person doing the work.
 *
 * Attributes whose name starts with an underscore are Shopify's own bookkeeping
 * (`_gpo_product_group`, `_has_gpo`). They are kept, but folded away by default -
 * an operator scanning for a name should not have to read past a product-group id.
 */
function LineProperties({ properties }: { properties: LineProp[] }): JSX.Element | null {
  if (properties.length === 0) return null
  const visible = properties.filter(p => !p.name.startsWith('_'))
  const internal = properties.filter(p => p.name.startsWith('_'))

  return (
    <div className="mt-2 flex flex-col gap-1.5">
      {visible.map(p => (
        <div key={p.name} className="flex flex-wrap gap-x-2 text-xs">
          <span className="text-muted-foreground">{p.name.replace(/[-:\s]+$/, '')}</span>
          <span className="font-medium">{p.value}</span>
        </div>
      ))}
      {internal.length > 0 ? (
        <details className="text-xs">
          <summary className="text-subtle-foreground cursor-pointer">
            {internal.length} store field(s)
          </summary>
          <div className="mt-1 flex flex-col gap-1 pl-3">
            {internal.map(p => (
              <div key={p.name} className="flex flex-wrap gap-x-2">
                <span className="text-subtle-foreground font-mono">{p.name}</span>
                <span className="text-muted-foreground font-mono">{p.value}</span>
              </div>
            ))}
          </div>
        </details>
      ) : null}
    </div>
  )
}

export function OrderLineItemsTable({
  products,
  lineItems,
}: OrderLineItemsTableProps): JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Products</CardTitle>
      </CardHeader>
      <Table>
        <TableHead>
          <TableRow>
            <TableHeaderCell>Product</TableHeaderCell>
            <TableHeaderCell>SKU</TableHeaderCell>
            <TableHeaderCell className="text-right">Quantity</TableHeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {products.length > 0
            ? products.map(product => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <ProductThumb url={product.productImageUrl} alt={product.productName} />
                      <span>{product.productName}</span>
                    </div>
                    {/* Matched on SKU: order_line_items and the raw Shopify
                        payload are two views of the same line, and SKU is the
                        only identifier both carry. */}
                    <LineProperties
                      properties={
                        lineItems.find(li => li.sku && li.sku === product.sku)?.properties ?? []
                      }
                    />
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-sm">
                    {product.sku ?? '—'}
                  </TableCell>
                  <TableCell numeric>{product.quantity}</TableCell>
                </TableRow>
              ))
            : lineItems.map(item => (
                <TableRow key={item.name}>
                  <TableCell>
                    <span>{item.name}</span>
                    <LineProperties properties={item.properties} />
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-sm">
                    {item.sku ?? '—'}
                  </TableCell>
                  <TableCell numeric>{item.quantity}</TableCell>
                </TableRow>
              ))}
        </TableBody>
      </Table>
    </Card>
  )
}
