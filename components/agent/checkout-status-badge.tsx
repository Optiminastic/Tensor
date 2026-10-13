import type { JSX } from 'react'

import { Badge } from '@/components/ui/badge'
import { checkoutStatus } from '@/lib/checkout-format'
import type { AbandonedCheckout } from '@/lib/validators/abandoned-checkouts'

interface CheckoutStatusBadgeProps {
  checkout: AbandonedCheckout
}

/**
 * Where a checkout stands. Recovered wins: "Ready to call" on a cart the
 * customer already paid for is not a nuance, it is wrong.
 */
export function CheckoutStatusBadge({ checkout }: CheckoutStatusBadgeProps): JSX.Element {
  const status = checkoutStatus(checkout)
  if (status === 'recovered') return <Badge tone="success">Recovered</Badge>
  if (status === 'ready') return <Badge tone="accent">Ready to call</Badge>
  return <Badge tone="neutral">No phone</Badge>
}
