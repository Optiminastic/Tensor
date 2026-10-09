'use client'

import { useMemo, useState } from 'react'

export type SortDirection = 'asc' | 'desc'

export interface SortState<K extends string> {
  key: K
  direction: SortDirection
}

export interface TableSort<T, K extends string> {
  /** The rows in sorted order. */
  rows: T[]
  /** The active sort, or null when the caller's natural order stands. */
  sort: SortState<K> | null
  /** Click a column: sorts it, then flips, then clears. */
  toggle: (key: K) => void
  /** For the header cell's arrow and aria-sort. */
  directionFor: (key: K) => SortDirection | null
}

export interface TableSortOptions<T, K extends string> {
  /** One comparator per sortable column, each in ASCENDING order. */
  comparators: Record<K, (a: T, b: T) => number>
  /** The column a table opens on, if any. */
  initial?: SortState<K>
}

/**
 * Sorting for a table, held in the component.
 *
 * THREE STATES PER COLUMN, not two: ascending, descending, then off. A
 * two-state toggle leaves no way back to the order the rows arrived in, and
 * that order is usually meaningful - newest first, or the sequence the planner
 * chose - so a reader who sorts by name to find something has to reload the
 * page to get their list back.
 *
 * Comparators are supplied per column rather than inferred from the value,
 * because the right order is a property of the DATA, not its type: "2 hr ago"
 * sorts by the timestamp behind it, and ₹1,24,999 by a number its formatted
 * string would sort wrongly.
 *
 * Sorting happens over every row, before pagination, or page two would be
 * sorted only within itself.
 */
export function useTableSort<T, K extends string>(
  rows: T[],
  { comparators, initial }: TableSortOptions<T, K>,
): TableSort<T, K> {
  const [sort, setSort] = useState<SortState<K> | null>(initial ?? null)

  const sorted = useMemo(() => {
    if (!sort) return rows
    const compare = comparators[sort.key]
    if (!compare) return rows
    // A copy: sorting the caller's array in place would mutate props.
    const next = [...rows]
    next.sort(sort.direction === 'asc' ? compare : (a, b) => compare(b, a))
    return next
  }, [rows, sort, comparators])

  function toggle(key: K): void {
    setSort(current => {
      if (!current || current.key !== key) return { key, direction: 'asc' }
      if (current.direction === 'asc') return { key, direction: 'desc' }
      return null
    })
  }

  return {
    rows: sorted,
    sort,
    toggle,
    directionFor: key => (sort && sort.key === key ? sort.direction : null),
  }
}
