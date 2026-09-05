'use client'

import { useMemo, useState } from 'react'

/** Page sizes offered in the pagination bar. */
export const PAGE_SIZES = [15, 25, 50, 100] as const

/** The default page size: 15, matching the other production tables. */
export const DEFAULT_PAGE_SIZE = 15

export interface Pagination<T> {
  /** The rows for the current page. */
  items: T[]
  /** 1-based page number, already clamped to what exists. */
  page: number
  pageCount: number
  pageSize: number
  /** Total rows across every page - the filtered set, not the raw one. */
  total: number
  /** 1-based inclusive range of the rows on screen, for "Showing 1 to 15 of 1007". */
  from: number
  to: number
  setPage: (page: number) => void
  setPageSize: (size: number) => void
}

/**
 * Pages an already-filtered list on the client.
 *
 * Client-side on purpose. Every production table filters, searches and counts
 * its tabs over the whole set - "Draft 14", "Locked 21" are counts of
 * everything, not of one page - so paging on the server would either break
 * those counts or need a second round trip to keep them honest. The lists are
 * hundreds of rows, not millions; what was hurting was rendering them all at
 * once, and that is exactly what this fixes.
 *
 * The page is CLAMPED rather than reset by an effect. Filtering from 68 pages
 * down to 2 while sitting on page 40 must show page 2, and doing that in a
 * useEffect would render one empty frame first.
 */
export function usePagination<T>(
  rows: T[],
  initialSize: number = DEFAULT_PAGE_SIZE,
): Pagination<T> {
  const [pageSize, setSize] = useState(initialSize)
  const [requestedPage, setPage] = useState(1)

  return useMemo(() => {
    const total = rows.length
    const pageCount = Math.max(1, Math.ceil(total / pageSize))
    const page = Math.min(Math.max(1, requestedPage), pageCount)
    const start = (page - 1) * pageSize

    return {
      items: rows.slice(start, start + pageSize),
      page,
      pageCount,
      pageSize,
      total,
      // Zero rows reads as "Showing 0 to 0 of 0", not "1 to 0".
      from: total === 0 ? 0 : start + 1,
      to: Math.min(start + pageSize, total),
      setPage,
      setPageSize: (size: number) => {
        setSize(size)
        // Back to the first page: keeping page 40 after switching to 100 per
        // page would land past the end of a list that just got shorter.
        setPage(1)
      },
    }
  }, [rows, pageSize, requestedPage])
}
