import type { Metadata } from 'next'
import type { JSX } from 'react'

import { ComingSoon } from '@/components/dashboard/coming-soon'

export const metadata: Metadata = { title: 'Batch Management' }

export default function BatchManagementPage(): JSX.Element {
  return <ComingSoon title="Batch Management" description="Batch Management lands here next." />
}
