import { Download, ShoppingBag } from 'lucide-react'
import Image from 'next/image'
import type { JSX } from 'react'

import type {
  OrderLineItem,
  OrderLineItemOption,
  OrderProduct,
} from '@/components/production/types'
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
  orderId: string
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

/** The personalisation the customer typed, under the product it belongs to.
 * Every field the storefront asked for is shown, labelled as the customer saw
 * it - a print operator reads these verbatim, so nothing is renamed here. */
function PersonalisationOptions({
  options,
}: {
  options: OrderLineItemOption[]
}): JSX.Element | null {
  if (options.length === 0) return null
  return (
    <dl className="mt-1.5 flex flex-col gap-0.5 text-sm">
      {options.map(option => (
        <div key={option.name} className="flex flex-wrap gap-x-1.5">
          <dt className="text-muted-foreground">{option.name}</dt>
          <dd className="text-foreground font-medium">{option.value}</dd>
        </div>
      ))}
    </dl>
  )
}

/** Pairs each product row with the personalisation from the matching line.
 *
 * `products` (order_line_items rows) and `lineItems` (the order's production
 * facts) are two records of the same purchase written by the same import, but
 * they are read back independently and the rows only tie-break on a random
 * uuid, so their order is not guaranteed to agree. Each line is claimed at
 * most once, by SKU first and by position only when the two lists are the same
 * length - so an order containing the same product twice with different names
 * cannot show one customer's text against the other's row. A line that cannot
 * be matched confidently shows nothing, which is the safe failure for
 * something an operator prints from. */
function pairOptions(
  products: OrderProduct[],
  lineItems: OrderLineItem[],
): OrderLineItemOption[][] {
  const claimed = new Set<number>()
  const claim = (at: number): OrderLineItemOption[] => {
    claimed.add(at)
    return lineItems[at].options
  }

  return products.map((product, index) => {
    const bySku = lineItems.findIndex(
      (item, at) => !claimed.has(at) && product.sku !== null && item.sku === product.sku,
    )
    if (bySku !== -1) return claim(bySku)
    if (products.length === lineItems.length && !claimed.has(index)) return claim(index)
    return []
  })
}

/** The model the customer will receive, rendered from the same template and the
 * same text as the file that goes to the printer - so what an operator checks
 * here cannot differ from what the machine makes. Rendering takes a few
 * seconds, so it is loaded lazily and only for a line that has personalisation.
 */
function PersonalisedPreview({ orderId, line }: { orderId: string; line: number }): JSX.Element {
  return (
    <Image
      src={`/api/orders/${orderId}/personalised-model?line=${line}&format=png`}
      alt="Preview of the personalised model"
      width={450}
      height={300}
      unoptimized
      loading="lazy"
      className="border-border bg-surface-muted mt-2 rounded-md border"
    />
  )
}

/** Downloads the line's personalised model - the customer's text rendered as
 * printable geometry from the product's template, generated on request rather
 * than by a designer. Shown only for a line that actually carries
 * personalisation; a product with no template yet answers with a plain message
 * explaining that, which is more useful than hiding the link. */
function PrintFileLink({ orderId, line }: { orderId: string; line: number }): JSX.Element {
  return (
    <a
      className="text-accent hover:text-accent-strong mt-1.5 inline-flex items-center gap-1.5 text-sm"
      href={`/api/orders/${orderId}/personalised-model?line=${line}`}
    >
      <Download className="size-3.5" aria-hidden />
      Print file
    </a>
  )
}

export function OrderLineItemsTable({
  orderId,
  products,
  lineItems,
}: OrderLineItemsTableProps): JSX.Element {
  const optionsByProduct = pairOptions(products, lineItems)

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
            ? products.map((product, index) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex items-start gap-3">
                      <ProductThumb url={product.productImageUrl} alt={product.productName} />
                      <div>
                        <span>{product.productName}</span>
                        <PersonalisationOptions options={optionsByProduct[index]} />
                        {optionsByProduct[index].length > 0 ? (
                          <>
                            <PrintFileLink orderId={orderId} line={index} />
                            <PersonalisedPreview orderId={orderId} line={index} />
                          </>
                        ) : null}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-sm">
                    {product.sku ?? '—'}
                  </TableCell>
                  <TableCell numeric>{product.quantity}</TableCell>
                </TableRow>
              ))
            : lineItems.map((item, index) => (
                <TableRow key={item.name}>
                  <TableCell>
                    {item.name}
                    <PersonalisationOptions options={item.options} />
                    {item.options.length > 0 ? (
                      <>
                        <PrintFileLink orderId={orderId} line={index} />
                        <PersonalisedPreview orderId={orderId} line={index} />
                      </>
                    ) : null}
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
