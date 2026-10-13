import { ExternalLink } from 'lucide-react'
import type { JSX, ReactNode } from 'react'

import {
  type ActivityErrors,
  AgentActivitySummary,
} from '@/components/agent/agent-activity-summary'
import { CallCheckoutButton } from '@/components/agent/call-checkout-button'
import { CheckoutAddress } from '@/components/agent/checkout-address'
import { CheckoutBasket } from '@/components/agent/checkout-basket'
import { type CheckoutActivity, fullDate, sinceWhen } from '@/lib/checkout-format'
import type { AbandonedCheckout } from '@/lib/validators/abandoned-checkouts'

interface CheckoutOverviewProps {
  checkout: AbandonedCheckout
  activity: CheckoutActivity
  options: { errors: ActivityErrors; callingEnabled: boolean }
}

/**
 * Everything Shopify's own abandoned-checkout page shows, then what the agent
 * did about it.
 *
 * Shopify first because it is the subject: the agent's calls and messages are
 * about this basket, and reading them without it means guessing what the
 * customer was being asked about.
 */
export function CheckoutOverview({
  checkout,
  activity,
  options,
}: CheckoutOverviewProps): JSX.Element {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center gap-2">
        <CallCheckoutButton checkout={checkout} disabled={!options.callingEnabled} />
        <a
          href={checkout.recovery_url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-link inline-flex items-center gap-1.5 text-sm font-medium hover:underline"
        >
          <ExternalLink className="size-3.5" aria-hidden />
          Recovery link
        </a>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Abandoned">
          {fullDate(checkout.created_at)}
          <span className="text-muted-foreground"> · {sinceWhen(checkout.created_at)}</span>
        </Field>
        <Field label="Recovered">
          {checkout.completed_at ? fullDate(checkout.completed_at) : 'Not yet'}
        </Field>
        <Field label="Customer">{checkout.customer_name || '—'}</Field>
        <Field label="Phone">
          <span className="font-mono tabular-nums">{checkout.phone || '—'}</span>
        </Field>
        {checkout.updated_at ? (
          <Field label="Last updated">{fullDate(checkout.updated_at)}</Field>
        ) : null}
      </div>

      <CheckoutBasket checkout={checkout} />

      <div className="grid gap-4 sm:grid-cols-2">
        <CheckoutAddress label="Shipping address" address={checkout.shipping_address} />
        <CheckoutAddress label="Billing address" address={checkout.billing_address} />
      </div>

      {checkout.note ? <Field label="Note">{checkout.note}</Field> : null}
      {checkout.attributes.length > 0 ? (
        <Field label="Additional details">
          {checkout.attributes.map(attr => (
            <span key={attr.key} className="block">
              <span className="text-muted-foreground">{attr.key}:</span> {attr.value}
            </span>
          ))}
        </Field>
      ) : null}

      <AgentActivitySummary activity={activity} errors={options.errors} />
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }): JSX.Element {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-subtle-foreground text-[11px] font-medium tracking-wide uppercase">
        {label}
      </span>
      <span className="text-foreground text-sm">{children}</span>
    </div>
  )
}
