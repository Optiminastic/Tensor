import type { JSX } from 'react'

import { Badge } from '@/components/ui/badge'

export type PriorityTier = 'high' | 'medium' | 'low'

// High's cutoff matches internal/production/planner.go's urgentPriority
// exactly (priority <= 1 is the backend's own "urgent/same-day" tier - a
// reprint is force-clamped to this same value). Medium/Low have no backend
// meaning today (priority is an unbounded, unvalidated int32) - this is a
// frontend-only convention layered on top of that one real threshold.
const HIGH_MAX = 1
const MEDIUM_MAX = 4

export function priorityTier(priority: number): PriorityTier {
  if (priority <= HIGH_MAX) return 'high'
  if (priority <= MEDIUM_MAX) return 'medium'
  return 'low'
}

const TIER_CONFIG: Record<PriorityTier, { label: string; tone: 'danger' | 'warning' | 'success' }> =
  {
    high: { label: 'High', tone: 'danger' },
    medium: { label: 'Medium', tone: 'warning' },
    low: { label: 'Low', tone: 'success' },
  }

interface PriorityTagProps {
  priority: number
}

export function PriorityTag({ priority }: PriorityTagProps): JSX.Element {
  const { label, tone } = TIER_CONFIG[priorityTier(priority)]
  return <Badge tone={tone}>{label}</Badge>
}
