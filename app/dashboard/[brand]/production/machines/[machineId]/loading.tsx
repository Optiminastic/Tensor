import type { JSX } from 'react'

import { PageSkeleton } from '@/components/dashboard/page-skeleton'

/** Shown while one machine's page is built. */
export default function MachineLoading(): JSX.Element {
  return <PageSkeleton variant="detail" />
}
