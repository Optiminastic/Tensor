'use client'

import { RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, type JSX } from 'react'

import { syncShopifyOrders } from '@/app/dashboard/brands/actions'
import { Button } from '@/components/ui/button'

interface OrdersSyncButtonProps {
  brand: string
  shopifyConnected: boolean
}

/**
 * Pulls the brand's most recent Shopify orders on demand, using the access
 * token its existing Shopify connection already stored - no separate
 * order-import OAuth grant needed. This is the only way orders enter Tensor:
 * nothing is pushed by Shopify and nothing polls in the background, so an
 * order placed since the last press shows up when - and only when - someone
 * presses this.
 */
export function OrdersSyncButton({ brand, shopifyConnected }: OrdersSyncButtonProps): JSX.Element {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [imported, setImported] = useState<number | null>(null)

  async function sync(): Promise<void> {
    setPending(true)
    setError(null)
    setImported(null)
    const res = await syncShopifyOrders(brand)
    setPending(false)
    if (!res.ok) {
      setError(res.error ?? 'Could not fetch orders from Shopify.')
      return
    }
    setImported(res.data?.imported ?? 0)
    router.refresh()
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => void sync()}
        disabled={pending || !shopifyConnected}
        title={shopifyConnected ? undefined : "This brand's Shopify isn't connected yet."}
      >
        <RefreshCw className={pending ? 'size-3.5 animate-spin' : 'size-3.5'} aria-hidden />
        {pending ? 'Syncing…' : 'Sync from Shopify'}
      </Button>
      {error ? (
        <p role="alert" className="text-danger text-xs">
          {error}
        </p>
      ) : null}
      {imported !== null && !error ? (
        <p role="status" className="text-muted-foreground text-xs">
          {imported === 0
            ? 'No orders returned by Shopify.'
            : `Imported ${imported} ${imported === 1 ? 'order' : 'orders'}.`}
        </p>
      ) : null}
    </div>
  )
}
