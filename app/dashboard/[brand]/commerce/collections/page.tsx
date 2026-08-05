import type { Metadata } from 'next'
import type { JSX } from 'react'

import { ComingSoon } from '@/components/dashboard/coming-soon'

export const metadata: Metadata = { title: 'Collections' }

export default function CommerceCollectionsPage(): JSX.Element {
  return <ComingSoon title="Collections" description="Shopify collections for this store." />
}
