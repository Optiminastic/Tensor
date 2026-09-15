'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useCallback, useState } from 'react'

/**
 * Tab state that lives in the URL without costing a server round trip.
 *
 * A tab kept only in useState is lost the moment you leave the page: opening an
 * order from Unfulfilled and coming back dropped you on All, with the order you
 * had just dealt with nowhere in sight. In the URL it survives, because Back
 * returns to the address you left from, and a link to the Unfulfilled tab
 * becomes a thing that exists.
 *
 * The mechanism matters as much as the outcome. This first shipped using
 * router.replace(), which in the App Router is a NAVIGATION: both force-dynamic
 * layouts and the page re-ran, every backend call being cache: 'no-store', and
 * a tab click took three to four seconds to return exactly the rows the browser
 * was already holding. Every one of these tabs filters an array that is already
 * in memory - the counts beside them are computed from it - so the server has
 * nothing to add.
 *
 * So: the value is React state, updated immediately, and the URL is mirrored
 * with the native history API, which Next.js supports precisely for this and
 * which fires no RSC request. The rendered value deliberately does NOT come
 * from useSearchParams() - reading it from there is what tied the pill
 * highlight to the server's response time.
 *
 * replaceState, not pushState: switching tabs is changing what you are looking
 * at, not a place to walk back out of. Pushing would make Back step through
 * every tab you had clicked before leaving.
 *
 * The fallback is kept out of the URL, so an untouched page keeps a clean
 * address and only a deliberate choice is written down.
 */
export function useQueryTab<T extends string>(
  key: string,
  fallback: T,
  allowed?: readonly T[],
): [T, (next: T) => void] {
  const pathname = usePathname()
  const params = useSearchParams()

  // Seeded once, from the address the page was opened at. Re-entering the page
  // is a fresh mount, which is what makes coming back from an order land on the
  // tab you left. A URL is typed by whoever is holding it, so an unknown value
  // falls back to the default rather than selecting no tab and rendering an
  // empty page.
  const [value, setValue] = useState<T>(() => {
    const raw = params.get(key)
    return raw !== null && (allowed === undefined || allowed.includes(raw as T))
      ? (raw as T)
      : fallback
  })

  const select = useCallback(
    (next: T): void => {
      setValue(next)

      // Read live from the address bar rather than the `params` snapshot: a
      // page may hold more than one of these hooks, and a stale closure would
      // let one overwrite the other's key.
      const updated = new URLSearchParams(window.location.search)
      if (next === fallback) {
        updated.delete(key)
      } else {
        updated.set(key, next)
      }
      const query = updated.toString()
      window.history.replaceState(null, '', query ? `${pathname}?${query}` : pathname)
    },
    [fallback, key, pathname],
  )

  return [value, select]
}
