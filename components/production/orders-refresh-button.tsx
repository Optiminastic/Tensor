'use client'

import { RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, type JSX } from 'react'

import { Button } from '@/components/ui/button'

/**
 * Re-runs the Orders page's server-side fetch without a full page reload -
 * useful on the live view while testing a real Shopify webhook delivery,
 * where nothing else on the page would otherwise prompt a re-fetch.
 */
export function OrdersRefreshButton(): JSX.Element {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  function refresh(): void {
    setPending(true)
    router.refresh()
    // router.refresh() doesn't return a promise tied to completion, so this
    // just gives the spin a beat to be visible rather than tracking the
    // actual fetch - the page's own content updates when the RSC responds.
    setTimeout(() => setPending(false), 600)
  }

  return (
    <Button type="button" variant="secondary" size="sm" onClick={refresh} disabled={pending}>
      <RefreshCw className={pending ? 'size-3.5 animate-spin' : 'size-3.5'} aria-hidden />
      Refresh
    </Button>
  )
}
