'use client'

import { ArrowLeft, Printer } from 'lucide-react'
import Link from 'next/link'
import type { JSX } from 'react'

import { Button, buttonVariants } from '@/components/ui/button'
import { inr } from '@/lib/format'
import type { BulkOrder } from '@/lib/validators/bulk-orders'

interface QuotationDocumentProps {
  order: BulkOrder
  brandName: string
  brandLogoUrl: string | null
  backHref: string
}

/**
 * The quotation as a document.
 *
 * Printing is the PDF: the Download button opens the browser's print dialog,
 * where "Save as PDF" is the destination. No PDF library, and the consequence
 * is the point - what the customer receives is exactly what is on screen, so
 * there is no second rendering of the same numbers that can disagree with the
 * first.
 *
 * Every figure comes from the saved order. Nothing here recomputes a total: the
 * backend did that when the order was saved and snapshotted the result, so this
 * document shows what was quoted rather than what the arithmetic would produce
 * today.
 */
export function QuotationDocument({
  order,
  brandName,
  brandLogoUrl,
  backHref,
}: QuotationDocumentProps): JSX.Element {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10 sm:px-6">
      {/* The controls are screen-only: a printed quotation with a Back button
          on it looks like a screenshot of software rather than a document. */}
      <div className="flex items-center justify-between gap-3 print:hidden">
        <Link href={backHref} className={buttonVariants({ variant: 'ghost', size: 'sm' })}>
          <ArrowLeft className="size-4" aria-hidden /> Bulk orders
        </Link>
        <Button size="sm" onClick={() => window.print()}>
          <Printer className="size-4" aria-hidden /> Download PDF
        </Button>
      </div>

      <article className="border-border bg-surface flex flex-col gap-8 rounded-lg border p-8 print:border-0 print:p-0 print:shadow-none">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            {brandLogoUrl ? (
              // Plain <img>: next/image optimises through a loader that the
              // print renderer may not have fetched yet, and a logo missing
              // from the printed page is worse than an unoptimised one.

              <img src={brandLogoUrl} alt={brandName} className="mb-2 h-10 w-auto object-contain" />
            ) : null}
            <span className="text-display text-2xl">{brandName}</span>
          </div>
          <div className="flex flex-col items-end gap-0.5 text-sm">
            <span className="text-display text-xl">Quotation</span>
            <span className="font-mono tabular-nums">{order.quotation_number}</span>
            <span className="text-muted-foreground font-mono text-xs tabular-nums">
              {order.order_date}
            </span>
            {order.valid_until ? (
              <span className="text-muted-foreground text-xs">
                Valid until <span className="font-mono tabular-nums">{order.valid_until}</span>
              </span>
            ) : null}
          </div>
        </header>

        <section className="flex flex-col gap-1">
          <span className="text-muted-foreground text-xs tracking-wide uppercase">Quoted to</span>
          <span className="text-sm font-medium">{order.customer_name}</span>
          {order.customer_email ? (
            <span className="text-muted-foreground text-sm">{order.customer_email}</span>
          ) : null}
          {order.customer_phone ? (
            <span className="text-muted-foreground text-sm">{order.customer_phone}</span>
          ) : null}
        </section>

        <section>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-border border-b text-left">
                <th className="pb-2 font-medium">Product</th>
                <th className="pb-2 font-medium">SKU</th>
                <th className="pb-2 text-right font-medium">Qty</th>
                <th className="pb-2 text-right font-medium">Unit</th>
                <th className="pb-2 text-right font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {order.lines.map(line => (
                <tr key={line.id} className="border-border/60 border-b">
                  <td className="py-2">{line.product_name}</td>
                  <td className="py-2 font-mono text-xs">{line.sku}</td>
                  <td className="py-2 text-right font-mono tabular-nums">{line.quantity}</td>
                  <td className="py-2 text-right font-mono tabular-nums">
                    {inr(line.unit_price, 2)}
                  </td>
                  <td className="py-2 text-right font-mono tabular-nums">
                    {inr(line.line_total, 2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="flex justify-end">
          <dl className="flex w-full max-w-xs flex-col gap-1.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="font-mono tabular-nums">{inr(order.subtotal, 2)}</dd>
            </div>
            {order.discount_percent > 0 ? (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Discount ({order.discount_percent}%)</dt>
                <dd className="font-mono tabular-nums">−{inr(order.discount_amount, 2)}</dd>
              </div>
            ) : null}
            <div className="border-border flex justify-between border-t pt-1.5 text-base font-medium">
              <dt>Total</dt>
              <dd className="font-mono tabular-nums">{inr(order.total, 2)}</dd>
            </div>
          </dl>
        </section>

        {order.notes ? (
          <section className="flex flex-col gap-1">
            <span className="text-muted-foreground text-xs tracking-wide uppercase">Notes</span>
            <p className="text-sm whitespace-pre-wrap">{order.notes}</p>
          </section>
        ) : null}
      </article>
    </main>
  )
}
