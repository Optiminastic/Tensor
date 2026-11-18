import type { JSX } from 'react'

import { Skeleton } from '@/components/ui/skeleton'

interface ListSkeletonProps {
  /** How many rows to stand in for. */
  rows?: number
}

/** Rows of a list that is still loading, in the list's own shape. */
export function ListSkeleton({ rows = 4 }: ListSkeletonProps): JSX.Element {
  return (
    <div className="flex flex-col gap-2" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </div>
  )
}
