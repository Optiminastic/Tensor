import type { Metadata } from 'next'
import type { JSX } from 'react'

import { ComingSoon } from '@/components/dashboard/coming-soon'

export const metadata: Metadata = { title: 'Production' }

export default function ProductionPage(): JSX.Element {
  return (
    <ComingSoon
      title="Production"
      description="Print queue, machines, material inventory and production jobs."
    />
  )
}
