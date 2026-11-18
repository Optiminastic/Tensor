import type { JSX } from 'react'

import { Skeleton } from '@/components/ui/skeleton'

import { ProductDetailSkeleton } from './product-detail-skeleton'

const TAB_WIDTHS = ['w-24', 'w-28', 'w-24', 'w-20'] as const

/**
 * The registry while it is built on the server, in its own fixed frame: the
 * compact heading and tabs, the product list on the left and the open
 * product's card on the right - the shape the page lands in, so nothing moves.
 */
export function RegistrySkeleton(): JSX.Element {
  return (
    <main
      aria-busy="true"
      className="flex w-full flex-col gap-4 px-4 pt-4 pb-6 sm:px-6 md:px-8 lg:h-dvh lg:overflow-hidden lg:pt-5 lg:pb-5"
    >
      <span className="sr-only" role="status">
        Loading
      </span>
      <div className="flex flex-col gap-1">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-12 w-48" />
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="flex gap-2">
        {TAB_WIDTHS.map(width => (
          <Skeleton key={width} className={`h-10 rounded-full ${width}`} />
        ))}
      </div>
      <div className="flex flex-col gap-4 lg:min-h-0 lg:flex-1 lg:flex-row">
        <div className="flex shrink-0 flex-col gap-1 lg:w-56">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-[74px] w-full" />
          ))}
        </div>
        <ProductDetailSkeleton />
      </div>
    </main>
  )
}
