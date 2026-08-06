import { ShoppingBag } from 'lucide-react'
import Image from 'next/image'
import type { JSX } from 'react'

import type { OrderLineItem, OrderProduct } from '@/components/production/types'
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
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-sm">
                    {product.sku ?? '—'}
                  </TableCell>
                  <TableCell numeric>{product.quantity}</TableCell>
                </TableRow>
              ))
            : lineItems.map(item => (
                <TableRow key={item.name}>
                  <TableCell>{item.name}</TableCell>
                  <TableCell className="text-muted-foreground">—</TableCell>
                  <TableCell numeric>{item.quantity}</TableCell>
                </TableRow>
              ))}
        </TableBody>
      </Table>
    </Card>
  )
}
