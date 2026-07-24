import type { Metadata } from 'next'
import type { JSX } from 'react'

import { ComingSoon } from '@/components/dashboard/coming-soon'

export const metadata: Metadata = { title: 'Analytics' }

export default function AnalyticsPage(): JSX.Element {
  return (
    <ComingSoon
      title="Analytics"
      description="Profitability, machine utilization and design performance."
    />
  )
}
