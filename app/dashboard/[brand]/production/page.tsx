import type { Metadata } from 'next'
import type { JSX } from 'react'

import { ComingSoon } from '@/components/dashboard/coming-soon'
import { FilamentInventoryView } from '@/components/production/filament-inventory-view'
import { JobQueueTable } from '@/components/production/job-queue-table'
import { MachineManagementTable } from '@/components/production/machine-management-table'
import { ProductionOverview } from '@/components/production/production-overview'
import { MACHINE_RECORDS, PRODUCTION_JOB_QUEUE } from '@/components/production/sample-data'

export const metadata: Metadata = { title: 'Production' }

const VIEW_TITLES: Record<string, string> = {
  batches: 'Batch Management',
}

interface ProductionPageProps {
  params: Promise<{ brand: string }>
  searchParams: Promise<{ view?: string }>
}

interface ProductionPageHeaderProps {
  title: string
  description: string
}

function ProductionPageHeader({ title, description }: ProductionPageHeaderProps): JSX.Element {
  return (
    <div className="flex flex-col gap-2">
      <h1 className="text-display text-3xl">{title}</h1>
      <p className="text-muted-foreground text-sm">{description}</p>
    </div>
  )
}

export default async function ProductionPage({
  params,
  searchParams,
}: ProductionPageProps): Promise<JSX.Element> {
  const { brand } = await params
  const { view } = await searchParams

  if (view === 'jobs') {
    return (
      <main className="flex w-full flex-col gap-8 px-6 py-10 md:px-8">
        <ProductionPageHeader
          title="Production Jobs"
          description="Every job in the queue, from slicing through packaging."
        />
        <JobQueueTable brand={brand} jobs={PRODUCTION_JOB_QUEUE} />
      </main>
    )
  }

  if (view === 'machines') {
    return (
      <main className="flex w-full flex-col gap-8 px-6 py-10 md:px-8">
        <ProductionPageHeader
          title="Machine Management"
          description="Add printers and keep their live status up to date."
        />
        <MachineManagementTable brand={brand} machines={MACHINE_RECORDS} />
      </main>
    )
  }

  if (view === 'inventory') {
    return (
      <main className="flex w-full flex-col gap-8 px-6 py-10 md:px-8">
        <FilamentInventoryView />
      </main>
    )
  }

  const title = view ? VIEW_TITLES[view] : undefined
  if (title) {
    return <ComingSoon title={title} description={`${title} lands here next.`} />
  }

  return (
    <main className="flex w-full flex-col gap-8 px-6 py-10 md:px-8">
      <ProductionPageHeader
        title="Production"
        description="Print queue, machines, and inventory at a glance."
      />
      <ProductionOverview />
    </main>
  )
}
