import type { JSX } from 'react'

import { PageSkeleton } from '@/components/dashboard/page-skeleton'

/** Shown while a workspace page (settings, users, brands, projects) is built on the server. */
export default function DashboardLoading(): JSX.Element {
  return <PageSkeleton />
}
