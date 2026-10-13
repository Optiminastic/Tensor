import type { JSX } from 'react'

import { money } from '@/lib/checkout-format'
import type { AbandonedCheckout, AbandonedLineItem } from '@/lib/validators/abandoned-checkouts'

interface CheckoutBasketProps {
  checkout: AbandonedCheckout
}

/**
 * The basket as Shopify's checkout page lays it out: each line with its price,
 * then the money broken down to the total.
 *
 * A breakdown line is drawn only when it carries something. A "Discount ₹0"
 * row on every checkout is a row the eye learns to skip, and then skips on
 * the one checkout where it mattered.
 */
export function CheckoutBasket({ checkout }: CheckoutBasketProps): JSX.Element {
  const currency = checkout.currency
  const discount = Number(checkout.discount_amount)
  const tax = Number(checkout.tax_amount)

  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-subtle-foreground text-[11px] font-medium tracking-wide uppercase">
        Basket · {checkout.item_count} item{checkout.item_count === 1 ? '' : 's'}
      </h3>

      <ul className="divide-border/70 border-border/70 divide-y rounded-lg border">
        {checkout.line_items.map((item, index) => (
          <BasketLine key={`${item.sku}-${index}`} item={item} currency={currency} />
        ))}
      </ul>

      <dl className="flex flex-col gap-1.5 text-sm">
        {checkout.subtotal_amount ? (
          <Total label="Subtotal" value={money(checkout.subtotal_amount, currency)} />
        ) : null}
        {discount > 0 ? (
          <Total
            label={
              checkout.discount_codes.length > 0
                ? `Discount (${checkout.discount_codes.join(', ')})`
                : 'Discount'
            }
            value={`−${money(checkout.discount_amount, currency)}`}
          />
        ) : null}
        {tax > 0 ? (
          <Total
            label={checkout.taxes_included ? 'Taxes (included)' : 'Taxes'}
            value={money(checkout.tax_amount, currency)}
          />
        ) : null}
        <div className="border-border/70 mt-1 flex items-baseline justify-between border-t pt-2">
          <dt className="text-foreground font-medium">Total</dt>
          <dd className="text-foreground font-mono font-medium tabular-nums">
            {money(checkout.total_amount, currency)}
          </dd>
        </div>
      </dl>
    </section>
  )
}

interface BasketLineProps {
  item: AbandonedLineItem
  currency: string
}

function BasketLine({ item, currency }: BasketLineProps): JSX.Element {
  return (
    <li className="flex gap-3 p-3">
      {item.image_url ? (
        // A plain img: Shopify's CDN is not in next/image's allowed hosts, and
        // a 48px thumbnail gains nothing from the optimiser.
        <img
          src={item.image_url}
          alt=""
          className="border-border/70 size-12 shrink-0 rounded-md border object-cover"
        />
      ) : (
        <div className="bg-surface-muted size-12 shrink-0 rounded-md" aria-hidden />
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-foreground text-sm font-medium">{item.title}</span>
        {item.variant_title ? (
          <span className="text-muted-foreground text-xs">{item.variant_title}</span>
        ) : null}
        {item.sku ? (
          <span className="text-subtle-foreground font-mono text-[11px]">{item.sku}</span>
        ) : null}
        {/* The personalisation, when the storefront sent one. It is what the
            customer actually chose, and the part a call must get right. */}
        {item.attributes.map(attr => (
          <span key={attr.key} className="text-muted-foreground text-xs">
            {attr.key}: <span className="text-foreground">{attr.value}</span>
          </span>
        ))}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-0.5">
        <span className="text-foreground font-mono text-sm tabular-nums">
          {item.line_total ? money(item.line_total, currency) : '—'}
        </span>
        {item.unit_price ? (
          <span className="text-subtle-foreground font-mono text-xs tabular-nums">
            {money(item.unit_price, currency)} × {item.quantity}
          </span>
        ) : (
          <span className="text-subtle-foreground font-mono text-xs tabular-nums">
            × {item.quantity}
          </span>
        )}
      </div>
    </li>
  )
}

function Total({ label, value }: { label: string; value: string }): JSX.Element {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-foreground font-mono tabular-nums">{value}</dd>
    </div>
  )
}
