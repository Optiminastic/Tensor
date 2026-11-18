import type { JSX } from 'react'

import { PageSkeleton } from '@/components/dashboard/page-skeleton'

/** Shown while one batch's page is built: its details beside the merged plate. */
export default function BatchLoading(): JSX.Element {
  return <PageSkeleton variant="detail" />
}
