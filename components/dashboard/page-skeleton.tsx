import type { JSX } from 'react'

import { Skeleton } from '@/components/ui/skeleton'

import { PageSkeletonDetail } from './page-skeleton-detail'
import { PageSkeletonList } from './page-skeleton-list'

type PageSkeletonVariant = 'list' | 'detail'

interface PageSkeletonProps {
  /**
   * list: a page heading, a tab strip and a table - most dashboard pages.
   * detail: a page heading, a details card beside a preview - one job, one
   * batch, one machine.
   */
  variant?: PageSkeletonVariant
}

/**
 * What a dashboard page shows while it is being built on the server.
 *
 * Without a loading.tsx a route segment has no Suspense boundary, so the
 * browser simply holds the previous page - frozen, with no sign the click
 * landed. A shape rather than a spinner, matching the page's header-then-
 * content rhythm, so nothing jumps when the real page replaces it. aria-busy
 * and a screen-reader line, because "wait" is information a screen reader
 * needs too.
 */
export function PageSkeleton({ variant = 'list' }: PageSkeletonProps): JSX.Element {
  return (
    <main aria-busy="true" className="flex w-full flex-col gap-8 px-4 py-10 sm:px-6 md:px-8">
      <span className="sr-only" role="status">
        Loading
      </span>

      <div className="flex flex-col gap-2">
        <Skeleton className="h-3 w-24" />
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-4 w-80" />
      </div>

      {variant === 'detail' ? <PageSkeletonDetail /> : <PageSkeletonList />}
    </main>
  )
}
