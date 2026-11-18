import type { JSX } from 'react'

import { PageSkeleton } from '@/components/dashboard/page-skeleton'

/** Shown while one job's page is built: its details beside the model preview. */
export default function JobLoading(): JSX.Element {
  return <PageSkeleton variant="detail" />
}
