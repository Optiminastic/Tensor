import type { Metadata } from 'next'
import type { JSX } from 'react'

import { ComingSoon } from '@/components/dashboard/coming-soon'

export const metadata: Metadata = { title: 'Settings' }

export default function SettingsPage(): JSX.Element {
  return <ComingSoon title="Settings" description="Workspace, brand and account settings." />
}
