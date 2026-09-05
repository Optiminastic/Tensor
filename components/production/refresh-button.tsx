'use client'

import { RefreshCw } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useTransition, type JSX } from 'react'

import { Button } from '@/components/ui/button'

interface RefreshButtonProps {
  /** What the button re-reads, for the screen-reader label: "jobs", "batches". */
  noun: string
}

/**
 * Re-reads the enclosing server component on demand.
 *
 * Every production page is a server component fetched once per navigation, so a
 * page left open shows the state it had when it loaded. AutoRefresh solves that
 * on a timer, but it is off unless NEXT_PUBLIC_PRODUCTION_REFRESH_SECONDS is
 * set - correct for a human-paced floor, where a table rewriting itself under
 * someone mid-read is worse than a stale one. That leaves no way to ask for
 * current data short of a browser reload, which throws away scroll position,
 * the open tab and the page you had paged to.
 *
 * The pipeline is what makes this matter: jobs and batches now appear on their
 * own, minutes after an order lands, with nobody having clicked anything. An
 * operator who has just marked a bed done and wants to see the next one needs
 * to ask.
 *
 * router.refresh() re-runs the server component and reconciles the result into
 * the existing tree, so client state above it survives. It is wrapped in a
 * transition because refresh() itself returns nothing to await - isPending is
 * the only honest signal of "still fetching", and without it the button would
 * report done the instant it was pressed.
 */
export function RefreshButton({ noun }: RefreshButtonProps): JSX.Element {
  const router = useRouter()
  const [pending, startTransition] = useTransition()

  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      disabled={pending}
      aria-label={`Refresh ${noun}`}
      onClick={() => startTransition(() => router.refresh())}
    >
      <RefreshCw className={pending ? 'size-3.5 animate-spin' : 'size-3.5'} aria-hidden />
      {pending ? 'Refreshing…' : 'Refresh'}
    </Button>
  )
}
