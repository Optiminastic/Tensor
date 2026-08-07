import type { Metadata } from 'next'
import type { JSX } from 'react'

import { ComingSoon } from '@/components/dashboard/coming-soon'
import { requirePermission } from '@/lib/authz'

export const metadata: Metadata = { title: 'AI Center' }

interface AiCenterPageProps {
  params: Promise<{ brand: string }>
}

export default async function AiCenterPage({ params }: AiCenterPageProps): Promise<JSX.Element> {
  const { brand } = await params
  await requirePermission('design:read', `/dashboard/${brand}`)
  return (
    <ComingSoon
      title="AI Center"
      description="Recommendations, the design optimizer and cost-savings insights."
    />
  )
}
