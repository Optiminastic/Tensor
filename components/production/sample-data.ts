import type { OverviewStat } from '@/components/dashboard/overview-stats'
import type { ActivityPoint, MachineSummary, ProductionJob } from '@/components/production/types'

// Illustrative content only: Tensor-Core has no production-jobs, batch, or
// filament-inventory backend yet (only a static /config/machines roster with
// no live status/telemetry). Replace with real service calls once those
// endpoints exist.

export const PRODUCTION_STATS: OverviewStat[] = [
  { label: 'Total Jobs', value: '250', hint: '+2.5% this month' },
  { label: 'Completed', value: '124', hint: '+2.5% this month' },
  { label: 'Failed', value: '14', hint: '-1.5% this month' },
  { label: 'Active Machines', value: '19', hint: '+2.5% this month' },
]

export const PRODUCTION_ACTIVITY: ActivityPoint[] = [
  { month: 'Jan', completed: 14, failed: 3 },
  { month: 'Feb', completed: 16, failed: 2 },
  { month: 'Mar', completed: 15, failed: 3 },
  { month: 'Apr', completed: 19, failed: 4 },
  { month: 'May', completed: 24, failed: 3 },
  { month: 'Jun', completed: 23, failed: 5 },
  { month: 'Jul', completed: 22, failed: 4 },
  { month: 'Aug', completed: 26, failed: 3 },
  { month: 'Sep', completed: 21, failed: 4 },
  { month: 'Oct', completed: 25, failed: 3 },
  { month: 'Nov', completed: 27, failed: 4 },
  { month: 'Dec', completed: 29, failed: 3 },
]

export const RECENT_JOBS: ProductionJob[] = [
  {
    id: '#2041',
    designName: 'Wall Planter — Ribbed',
    machine: 'Machine A',
    startedAt: 'Jul 30, 2026',
    durationHours: 3.5,
    status: 'printing',
  },
  {
    id: '#2040',
    designName: 'Desk Organizer — Modular',
    machine: 'Machine C',
    startedAt: 'Jul 30, 2026',
    durationHours: 2.1,
    status: 'queued',
  },
  {
    id: '#2039',
    designName: 'Pendant Light Shade',
    machine: 'Machine B',
    startedAt: 'Jul 29, 2026',
    durationHours: 5.25,
    status: 'completed',
  },
  {
    id: '#2038',
    designName: 'Cable Clip — 6mm',
    machine: 'Machine D',
    startedAt: 'Jul 29, 2026',
    durationHours: 0.75,
    status: 'completed',
  },
  {
    id: '#2037',
    designName: 'Vase — Twist 220mm',
    machine: 'Machine A',
    startedAt: 'Jul 28, 2026',
    durationHours: 6.4,
    status: 'failed',
  },
]

export const MACHINES: MachineSummary[] = [
  { id: 'machine-a', name: 'Machine A', status: 'printing', jobsToday: 12 },
  { id: 'machine-b', name: 'Machine B', status: 'idle', jobsToday: 8 },
  { id: 'machine-c', name: 'Machine C', status: 'printing', jobsToday: 15 },
  { id: 'machine-d', name: 'Machine D', status: 'offline', jobsToday: 0 },
]
