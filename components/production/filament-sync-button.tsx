'use client'

import { RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState, type JSX } from 'react'

import { syncFilamentAction } from '@/app/dashboard/[brand]/production/filament-sync-actions'
import { Button } from '@/components/ui/button'

interface FilamentSyncButtonProps {
  brand: string
}

/** Grams to kilograms, matching how BambuBuddy presents the shelf total. */
function kilos(grams: number): string {
  return `${(grams / 1000).toFixed(1)}kg`
}

/**
 * Pulls the spool shelf from BambuBuddy on demand.
 *
 * Mirrors FleetSyncButton: manual rather than polled, because the far end is a
 * laptop over a VPN and a shelf changes when someone puts a spool on it.
 *
 * The result deliberately reports BOTH counts - spools and material/colour
 * buckets - because they are different numbers and an operator comparing this
 * page with BambuBuddy needs to know which one they are looking at.
 */
export function FilamentSyncButton({ brand }: FilamentSyncButtonProps): JSX.Element {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)

  async function sync(): Promise<void> {
    setPending(true)
    setError(null)
    setResult(null)

    const res = await syncFilamentAction(brand)
    setPending(false)

    if (!res.ok) {
      setError(res.error ?? 'Could not reach BambuBuddy to sync filament.')
      return
    }
    const data = res.data
    if (!data) return

    // An empty shelf is stated plainly rather than shown as a success: it looks
    // identical to a broken connection on a page that was already empty.
    if (data.spools === 0) {
      setError('BambuBuddy answered, but has no spools in its inventory.')
      return
    }
    setResult(
      `${data.spools} spool(s) → ${data.created + data.updated} material(s), ${kilos(data.total_grams)} available.`,
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
