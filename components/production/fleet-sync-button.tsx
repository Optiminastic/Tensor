'use client'

import { RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, type JSX } from 'react'

import { syncFleetAction } from '@/app/dashboard/[brand]/production/fleet-sync-actions'
import { Button } from '@/components/ui/button'

interface FleetSyncButtonProps {
  brand: string
}

/**
 * Pulls the printer fleet from BambuBuddy on demand.
 *
 * This is the only thing that populates Machine Management - nothing syncs on a
 * timer or at startup - so a fresh deployment shows an empty table until
 * someone presses this. Deliberate: polling a printer host that may be asleep,
 * on a laptop, over a VPN, is worse than an explicit action. But it does mean
 * the page has to offer the action, or the fleet is unreachable from the
 * browser entirely.
 *
 * Mirrors OrdersSyncButton, which makes the same trade for Shopify orders.
 */
export function FleetSyncButton({ brand }: FleetSyncButtonProps): JSX.Element {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)

  async function sync(): Promise<void> {
    setPending(true)
    setError(null)
    setResult(null)

    const res = await syncFleetAction(brand)
    setPending(false)

    if (!res.ok) {
      setError(res.error ?? 'Could not reach BambuBuddy to sync the fleet.')
      return
    }

    const data = res.data
    const synced = data?.synced ?? 0
    const removed = data?.removed ?? 0

    // Zero printers is reported plainly rather than as a success. BambuBuddy
    // answered but has no printers registered, which looks identical to a
    // broken connection on a table that was already empty.
    if (synced === 0 && removed === 0) {
      setError('BambuBuddy answered, but reported no printers.')
      return
    }

    const names = data?.names?.length ? `: ${data.names.join(', ')}` : ''
    setResult(
      removed > 0
        ? `${synced} printer(s) synced${names}, ${removed} removed.`
        : `${synced} printer(s) synced${names}.`,
    )
    router.refresh()
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="secondary"
        size="sm"
        disabled={pending}
        onClick={() => void sync()}
      >
        <RefreshCw className={pending ? 'size-3.5 animate-spin' : 'size-3.5'} aria-hidden />
        {pending ? 'Syncing…' : 'Sync from BambuBuddy'}
      </Button>
      {error ? (
        <p role="alert" className="text-danger text-xs">
          {error}
        </p>
      ) : null}
      {result ? (
        <p role="status" className="text-muted-foreground text-xs">
          {result}
        </p>
      ) : null}
    </div>
  )
}
