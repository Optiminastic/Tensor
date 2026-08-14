'use client'

import { useRouter } from 'next/navigation'
import { useEffect, type JSX } from 'react'

interface AutoRefreshProps {
  /** Seconds between refreshes. Values below 2 are clamped: this triggers a
   * full server round-trip for the page, so a fast interval is a load
   * generator, not a smoother UI. */
  intervalSeconds?: number
  /** Set false to mount the component but do nothing - lets a page decide at
   * render time without breaking the rules of hooks. */
  enabled?: boolean
}

const MIN_INTERVAL_SECONDS = 2
const DEFAULT_INTERVAL_SECONDS = 10

/**
 * Re-fetches the enclosing server component on an interval, rendering nothing.
 *
 * Every production page is a server component fetched once per navigation, so
 * a page left open shows a frozen snapshot: batches never appear, machines
 * never change status, and a counting-down timer stops counting. That is fine
 * for a human-paced shop floor and wrong for watching an automated run, where
 * the whole point is seeing state move without touching anything.
 *
 * A leaf client component doing `router.refresh()` is the smallest thing that
 * fixes it: the pages stay server components, no data fetching moves to the
 * client, and nothing else in the tree becomes client-side. Deliberately not a
 * websocket or a polling data layer - this is for watching, not a product
 * feature, and it should be trivial to delete.
 */
export function AutoRefresh({
  intervalSeconds = DEFAULT_INTERVAL_SECONDS,
  enabled = true,
}: AutoRefreshProps): JSX.Element | null {
  const router = useRouter()

  useEffect(() => {
    if (!enabled) return
    const seconds = Math.max(intervalSeconds, MIN_INTERVAL_SECONDS)
    const id = window.setInterval(() => router.refresh(), seconds * 1000)
    return () => window.clearInterval(id)
  }, [router, intervalSeconds, enabled])

  return null
}
