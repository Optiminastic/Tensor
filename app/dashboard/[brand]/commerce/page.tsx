import type { Metadata } from 'next'
import type { JSX } from 'react'

import { ComingSoon } from '@/components/dashboard/coming-soon'

export const metadata: Metadata = { title: 'Commerce' }

export default function CommercePage(): JSX.Element {
  return <ComingSoon title="Commerce" description="Shopify products, orders and collections." />
}
