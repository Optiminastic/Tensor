import type { JSX } from 'react'

import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

const TAB_WIDTHS = ['w-16', 'w-24', 'w-20', 'w-14'] as const
const ROWS = 8

/** The list shape under a page heading: a tab strip and a table. */
export function PageSkeletonList(): JSX.Element {
  return (
    <>
      <div className="flex gap-2">
        {TAB_WIDTHS.map(width => (
          <Skeleton key={width} className={`h-9 rounded-full ${width}`} />
        ))}
      </div>
      <Card className="flex flex-col gap-3 p-4">
        {Array.from({ length: ROWS }, (_, i) => (
          <div
            key={i}
            className="border-border flex items-center gap-4 border-b pb-3 last:border-0"
          >
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </Card>
    </>
  )
}
