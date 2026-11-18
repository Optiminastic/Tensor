import type { JSX } from 'react'

import { PageSkeleton } from '@/components/dashboard/page-skeleton'

/**
 * What Production shows while a page is being built on the server: the shared
 * list skeleton (heading, tabs, table), so every page under Production - and
 * the rest of the dashboard - loads in the same shape. See PageSkeleton.
 */
export default function ProductionLoading(): JSX.Element {
  return <PageSkeleton />
}
