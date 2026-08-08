import type { Metadata } from 'next'
import type { JSX } from 'react'

import { type OverviewStat } from '@/components/dashboard/overview-stats'
import { toMachineSummary, toRecentJob } from '@/components/production/adapters'
import { ProductionOverview } from '@/components/production/production-overview'
import { ProductionPageHeader } from '@/components/production/production-page-header'
import { resolveBackendToken } from '@/lib/backend-token'
import type { Machine } from '@/lib/validators/machines'
import type { ProductionJob } from '@/lib/validators/production'
import { listMachines } from '@/services/machines.service'
import { listProductionJobs } from '@/services/production.service'

export const metadata: Metadata = { title: 'Production' }

export default async function ProductionPage(): Promise<JSX.Element> {
  let jobs: ProductionJob[] = []
  let machines: Machine[] = []
  let error: string | null = null
  const { token, error: tokenError } = await resolveBackendToken()
  if (!token) {
    error = tokenError ?? 'Your session has expired. Sign in again.'
  } else {
    try {
      const [j, m] = await Promise.all([listProductionJobs(token), listMachines(token)])
      jobs = j
      machines = m
    } catch {
      error = 'Could not load production data. Is the backend running?'
    }
  }

  const stats: OverviewStat[] = [
    { label: 'Total Jobs', value: String(jobs.length) },
    { label: 'Completed', value: String(jobs.filter(j => j.status === 'completed').length) },
    { label: 'Failed', value: String(jobs.filter(j => j.status === 'failed').length) },
    {
      label: 'Active Machines',
      value: String(machines.filter(m => m.status === 'online' || m.status === 'busy').length),
    },
  ]

  return (
    <main className="flex w-full flex-col gap-8 px-6 py-10 md:px-8">
      <ProductionPageHeader
        title="Production"
        description="Print queue, machines, and inventory at a glance."
      />
      {error ? (
        <p role="alert" className="bg-danger-subtle text-danger rounded-md px-3 py-2 text-sm">
          {error}
        </p>
      ) : (
        <ProductionOverview
          stats={stats}
          recentJobs={jobs.slice(0, 8).map(toRecentJob)}
          machines={machines.map(toMachineSummary)}
        />
      )}
    </main>
  )
}
