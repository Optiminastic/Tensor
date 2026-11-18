import type { JSX } from 'react'

import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

import { DesignFieldsSkeleton } from './design-fields-skeleton'

/**
 * The open product's card while its definition loads: the same header, the
 * Design & fields section open with its parts, file and fields, and the two
 * closed sections below - so the card does not jump when the product lands.
 */
export function ProductDetailSkeleton(): JSX.Element {
  return (
    <Card
      className="flex min-w-0 flex-1 flex-col gap-3 overflow-hidden p-4 lg:min-h-0"
      aria-busy="true"
      aria-label="Loading the product"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-3 w-28" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-28" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="size-8" />
        </div>
      </div>

      <Skeleton className="h-5 w-32" />
      <DesignFieldsSkeleton />

      <Skeleton className="h-5 w-44" />
      <Skeleton className="h-5 w-28" />
    </Card>
  )
}
