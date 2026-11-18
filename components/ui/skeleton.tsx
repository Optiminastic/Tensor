import type { JSX } from 'react'

import { cn } from '@/lib/utils'

interface SkeletonProps {
  /** Size and shape: a skeleton takes the dimensions of what it stands in for. */
  className?: string
}

/**
 * A placeholder block shown where content is still loading.
 *
 * Shaped like the thing it replaces, so the page keeps its layout while it
 * loads instead of a line of "Loading…" that jumps when the content lands.
 * Hidden from assistive technology: the region that holds it says it is busy.
 */
export function Skeleton({ className }: SkeletonProps): JSX.Element {
  return <div aria-hidden className={cn('bg-surface-muted animate-pulse rounded-md', className)} />
}
