import type { Metadata } from 'next'
import type { JSX } from 'react'

import { ComingSoon } from '@/components/dashboard/coming-soon'

export const metadata: Metadata = { title: 'AI Center' }

export default function AiCenterPage(): JSX.Element {
  return (
    <ComingSoon
      title="AI Center"
      description="Recommendations, the design optimizer and cost-savings insights."
    />
  )
}
