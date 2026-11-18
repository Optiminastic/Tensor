import type { JSX } from 'react'

import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

/** The detail shape under a page heading: a details card beside a preview. */
export function PageSkeletonDetail(): JSX.Element {
  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <Card className="flex flex-1 flex-col gap-4 p-4">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="flex items-center justify-between gap-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-40" />
          </div>
        ))}
      </Card>
      <Card className="flex flex-col gap-3 p-4 lg:w-[420px]">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-72 w-full" />
      </Card>
    </div>
  )
}
