import type { JSX } from 'react'

import { PageSkeleton } from '@/components/dashboard/page-skeleton'

/** Shown while any brand page without a more specific loading screen is built on the server. */
export default function BrandLoading(): JSX.Element {
  return <PageSkeleton />
}
