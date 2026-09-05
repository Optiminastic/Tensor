'use client'

import { RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState, type JSX } from 'react'

import { syncShopifyOrders } from '@/app/dashboard/brands/actions'
import { isAllBrands } from '@/components/dashboard/nav-config'
import { Button } from '@/components/ui/button'

interface OrdersSyncButtonProps {
  brand: string
  shopifyConnected: boolean
}

/**
 * Milliseconds after starting a sync at which the page reloads to show what has
 * arrived so far.
 *
 * Several passes rather than one because the import is now a background job and
 * finishes when it finishes: a backlog of hundreds takes minutes, while a quiet
 * morning's handful is done before the first reload. Reloading a few times over
 * the first half minute covers both without asking the operator to guess.
 */
const REFRESH_AT_MS = [4_000, 12_000, 30_000]

/**
 * Starts a pull of the brand's Shopify orders.
 *
 * It starts one rather than performing one. The import used to run inside this
 * request, and the request is abandoned by the browser after five seconds - so
 * the backend's context was cancelled mid-import, every order still to come
 * failed silently, and the button reported the few that had made it as though
 * that were the lot. Orders 114775 to 114809 were missing from the Orders page
 * for exactly that reason. The pull is a worker job now, so what comes back is
 * "started", not a count.
 *
 * Orders also arrive on their own now, every ORDER_SYNC_INTERVAL_MINUTES, so
 * this is the impatient path rather than the only one.
 *
 * On the "All brands" view it starts a pull for every connected store. That
 * view's slug is a sentinel rather than a real brand, so it has no connection of
 * its own - which is why the button used to be disabled there, on the page most
 * people actually work from.
 */
export function OrdersSyncButton({ brand, shopifyConnected }: OrdersSyncButtonProps): JSX.Element {
  const router = useRouter()
  // The all-brands view never has a connection of its own to check; the
  // backend decides whether any store is connected and says so if none is.
  const canSync = shopifyConnected || isAllBrands(brand)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [started, setStarted] = useState(false)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  // Leaving the page mid-sync must not leave reloads queued against a router
  // that has moved on.
  useEffect(() => {
    const pending = timers
    return () => {
      pending.current.forEach(clearTimeout)
      pending.current = []
    }
  }, [])

  async function sync(): Promise<void> {
    setPending(true)
    setError(null)
    setStarted(false)
    const res = await syncShopifyOrders(brand)
    setPending(false)
    if (!res.ok) {
      setError(res.error ?? 'Could not start the Shopify sync.')
      return
    }
    setStarted(true)
    timers.current.forEach(clearTimeout)
    timers.current = REFRESH_AT_MS.map(ms => setTimeout(() => router.refresh(), ms))
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        onClick={() => void sync()}
        disabled={pending || !canSync}
        title={canSync ? undefined : "This brand's Shopify isn't connected yet."}
      >
        <RefreshCw className={pending ? 'size-3.5 animate-spin' : 'size-3.5'} aria-hidden />
        {pending ? 'Starting…' : 'Sync from Shopify'}
      </Button>
      {error ? (
        <p role="alert" className="text-danger text-xs">
          {error}
        </p>
      ) : null}
      {started && !error ? (
        <p role="status" className="text-muted-foreground text-xs">
          Sync started. Orders appear here as they import.
        </p>
      ) : null}
    </div>
  )
}
