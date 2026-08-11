'use client'

import { useRouter } from 'next/navigation'
import type { JSX } from 'react'

import { Switch } from '@/components/ui/switch'

interface OrdersLiveToggleProps {
  brand: string
  live: boolean
}

/**
 * Switches the Orders table between the 20 seeded dummy orders (default) and
 * real orders Tensor-Core has imported from Shopify. Drives the view through
 * the `live` search param so the page stays a server component and re-fetches
 * from Tensor-Core on toggle. Pulling fresh orders from Shopify is a separate,
 * explicit action - see OrdersSyncButton - since a toggle that's already on
 * has nothing to react to on a page revisit.
 */
export function OrdersLiveToggle({ brand, live }: OrdersLiveToggleProps): JSX.Element {
  const router = useRouter()

  function toggle(checked: boolean): void {
    const query = checked ? '?live=1' : ''
    router.push(`/dashboard/${brand}/production/orders${query}`)
  }

  return (
    <label className="flex items-center gap-2.5">
      <span className="text-muted-foreground text-sm">
        {live ? 'Live Shopify orders' : 'Sample orders'}
      </span>
      <Switch checked={live} onCheckedChange={toggle} aria-label="Show live Shopify orders" />
    </label>
  )
}
