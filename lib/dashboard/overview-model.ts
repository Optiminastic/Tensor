import {
  attentionItems,
  throughput,
  topProducts,
  weekOverWeekDelta,
  weeklyActivity,
  weeklyRevenue,
  type AttentionItem,
  type ThroughputTotals,
  type TopProduct,
  type TrendDelta,
  type WeekAmount,
  type WeeklyPoint,
} from '@/lib/dashboard/analytics'
import {
  summariseJobs,
  summariseMachines,
  summariseRevenue,
  type JobsSummary,
  type MachinesSummary,
  type RevenueSummary,
} from '@/lib/dashboard/overview'
import type { Machine } from '@/lib/validators/machines'
import type { Order, ProductionJob } from '@/lib/validators/production'

/** Everything the overview shows, derived once from the three lists. */
export interface OverviewModel {
  revenue: RevenueSummary
  revenueTrend: WeekAmount[]
  revenueDelta: TrendDelta | null
  jobs: JobsSummary
  machines: MachinesSummary
  activity: WeeklyPoint[]
  load: ThroughputTotals
  completedThisWeek: number
  completedDelta: TrendDelta | null
  busyPrinters: number
  products: TopProduct[]
  attention: AttentionItem[]
}

interface OverviewInput {
  orders: Order[]
  jobs: ProductionJob[]
  machines: Machine[]
}

/** Pure: the same lists always give the same overview. */
export function overviewModel({ orders, jobs, machines }: OverviewInput): OverviewModel {
  const activity = weeklyActivity(jobs)
  const revenueTrend = weeklyRevenue(orders)
  return {
    revenue: summariseRevenue(orders),
    revenueTrend,
    revenueDelta: weekOverWeekDelta(revenueTrend.map(point => point.value)),
    jobs: summariseJobs(jobs),
    machines: summariseMachines(machines),
    activity,
    load: throughput(jobs),
    completedThisWeek: activity[activity.length - 1]?.completed ?? 0,
    completedDelta: weekOverWeekDelta(activity.map(point => point.completed)),
    busyPrinters: machines.filter(machine => machine.status === 'busy').length,
    products: topProducts(jobs),
    attention: attentionItems(jobs),
  }
}
