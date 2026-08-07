import type { Metadata } from 'next'
import type { JSX } from 'react'

import { ComingSoon } from '@/components/dashboard/coming-soon'
import { requirePermission } from '@/lib/authz'

export const metadata: Metadata = { title: 'Analytics' }

interface AnalyticsPageProps {
  params: Promise<{ brand: string }>
}

export default async function AnalyticsPage({ params }: AnalyticsPageProps): Promise<JSX.Element> {
  const { brand } = await params
  await requirePermission('pricing:read', `/dashboard/${brand}`)
  return (
    <ComingSoon
      title="Analytics"
      description="Profitability, machine utilization and design performance."
    />
  )
}
