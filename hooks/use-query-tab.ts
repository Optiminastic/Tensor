'use client'

import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useCallback } from 'react'

/**
 * Tab state held in the URL instead of component state.
 *
 * A tab kept in useState is lost the moment you leave the page. Opening an
 * order from the Unfulfilled tab and coming back dropped you on All, with the
 * order you had just dealt with nowhere in sight - so the work of finding your
 * place had to be redone on every single order. The same applied to every
 * tabbed page in Production.
 *
 * In the URL it survives the round trip, because going back returns to the
 * address you left from. It also makes the view shareable and bookmarkable: a
 * link to the Unfulfilled tab is now a thing that exists.
 *
 * `replace`, not `push`: switching tabs is changing what you are looking at,
 * not a place you should have to walk back out of. Pushing would make Back step
 * through every tab you had clicked before it left the page - which is the
 * behaviour being fixed here, in a different form.
 *
 * The fallback value is kept OUT of the URL, so the default view stays a clean
 * address and only a deliberate choice is written down.
 */
export function useQueryTab<T extends string>(
  key: string,
  fallback: T,
  allowed?: readonly T[],
): [T, (next: T) => void] {
  const router = useRouter()
  const pathname = usePathname()
  const params = useSearchParams()

  // A URL is typed by whoever is holding it. An unknown value falls back to the
  // default rather than selecting no tab and rendering an empty page, which is
  // what a stale bookmark or a hand-edited address would otherwise produce.
  const raw = params.get(key)
  const value =
    raw !== null && (allowed === undefined || allowed.includes(raw as T)) ? (raw as T) : fallback

  const setValue = useCallback(
    (next: T): void => {
      // Built from the current params so a tab change keeps the search term,
      // the period filter and anything else already in the address.
      const updated = new URLSearchParams(params.toString())
      if (next === fallback) {
        updated.delete(key)
      } else {
        updated.set(key, next)
      }
      const query = updated.toString()
      // scroll: false - switching tabs should not throw you back to the top of
      // a list you have scrolled down.
      router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false })
    },
    [fallback, key, params, pathname, router],
  )

  return [value, setValue]
}
