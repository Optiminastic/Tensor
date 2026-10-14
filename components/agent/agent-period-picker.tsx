'use client'

import { usePathname, useRouter } from 'next/navigation'
import type { JSX } from 'react'

import type { PeriodValue } from '@/components/production/date-range'
import { OverviewDateRange } from '@/components/production/overview-date-range'
import { periodToSearch } from '@/lib/agent-period'

interface AgentPeriodPickerProps {
  value: PeriodValue
}

/**
 * The same period control Production uses - presets, week stepping, a week
 * jump and a custom range - with its state kept in the URL rather than in
 * React state. The page is a server component that computes the overview from
 * the period, so the URL is the one place both can read; it also makes a
 * period shareable as a link.
 */
export function AgentPeriodPicker({ value }: AgentPeriodPickerProps): JSX.Element {
  const router = useRouter()
  const pathname = usePathname()

  return (
    <OverviewDateRange
      value={value}
      onChange={next => router.replace(`${pathname}?${periodToSearch(next)}`, { scroll: false })}
    />
  )
}
