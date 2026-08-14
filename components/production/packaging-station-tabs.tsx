'use client'

import { useMemo, useState, type JSX } from 'react'

import { AssemblyQueueTable } from '@/components/production/assembly-queue-table'
import type { BatchNumbers } from '@/components/production/batch-label'
import {
  ALL_TIME_PERIOD,
  isWithinDateRange,
  type PeriodValue,
  resolvePeriod,
} from '@/components/production/date-range'
import { DispatchQueueTable } from '@/components/production/dispatch-queue-table'
import { FilterBar } from '@/components/production/filter-bar'
import { FinishingQueueTable } from '@/components/production/finishing-queue-table'
import { PackagingQueueTable } from '@/components/production/packaging-queue-table'
import { QcQueueTable } from '@/components/production/qc-queue-table'
import type { DispatchReadyOrder } from '@/components/production/types'
import type { TabItem } from '@/components/ui/tabs'
import type { DispatchOrder } from '@/lib/validators/dispatch'
import type { ProductionJob } from '@/lib/validators/production'

type TabValue = 'assembly' | 'finishing' | 'qc' | 'packaging' | 'dispatch'

export interface DispatchPanelData {
  dispatches: DispatchOrder[]
  readyOrders: DispatchReadyOrder[]
  orderNumbers: Record<string, string>
  // Set when the dispatch/order lookups failed on their own (e.g. a role
  // without dispatch:read) - the other three stations still render.
  error: string | null
}

interface PackagingStationTabsProps {
  brand: string
  queues: {
    assembly: ProductionJob[]
    finishing: ProductionJob[]
    qc: ProductionJob[]
    packaging: ProductionJob[]
  }
  // Which bed each job was printed on, for the three station queues' Batch
  // column. Empty when the batch list wasn't readable - the column then falls
  // back to a short batch id.
  batchNumbers: BatchNumbers
  dispatch: DispatchPanelData
}

function matchesJobSearch(job: ProductionJob, search: string): boolean {
  if (!search) return true
  const haystack = `${job.job_number} ${job.description}`.trim().toLowerCase()
  return haystack.includes(search.trim().toLowerCase())
}

function matchesOrderSearch(order: DispatchReadyOrder, search: string): boolean {
  if (!search) return true
  const haystack = `${order.orderNumber} ${order.customerName ?? ''}`.trim().toLowerCase()
  return haystack.includes(search.trim().toLowerCase())
}

/** The post-print stations in pipeline order - Assembly -> Finishing -> Quality
 * Check -> Packaging -> Dispatch - switched by one tab bar, with a search box
 * and date filter alongside it (the same FilterBar strip the Jobs, Orders,
 * Batches and Filament tables use). Each panel is the queue of work waiting at
 * that station.
 *
 * Search and period apply to whichever station is open, since each station's
 * queue is its own list of jobs. The tab counts stay unfiltered on purpose:
 * that number is the real depth of work waiting at a station, which an
 * operator needs to see whatever they happen to have typed in the search box. */
export function PackagingStationTabs({
  brand,
  queues,
  batchNumbers,
  dispatch,
}: PackagingStationTabsProps): JSX.Element {
  const [tab, setTab] = useState<TabValue>('assembly')
  const [search, setSearch] = useState('')
  const [period, setPeriod] = useState<PeriodValue>(ALL_TIME_PERIOD)

  const tabs: TabItem[] = [
    { value: 'assembly', label: 'Assembly', count: queues.assembly.length },
    { value: 'finishing', label: 'Finishing', count: queues.finishing.length },
    { value: 'qc', label: 'Quality Check', count: queues.qc.length },
    { value: 'packaging', label: 'Packaging', count: queues.packaging.length },
    { value: 'dispatch', label: 'Dispatch', count: dispatch.readyOrders.length },
  ]

  const periodRange = useMemo(() => resolvePeriod(period, new Date()), [period])

  const visible = useMemo(() => {
    const apply = (jobs: ProductionJob[]): ProductionJob[] =>
      jobs.filter(
        job => matchesJobSearch(job, search) && isWithinDateRange(job.created_at, periodRange),
      )
    return {
      assembly: apply(queues.assembly),
      finishing: apply(queues.finishing),
      qc: apply(queues.qc),
      packaging: apply(queues.packaging),
    }
  }, [queues, search, periodRange])

  // Dispatch is searchable but not datable: DispatchReadyOrder carries no
  // timestamp, so the date control is withheld on that tab rather than shown
  // doing nothing.
  const readyOrders = useMemo(
    () => dispatch.readyOrders.filter(order => matchesOrderSearch(order, search)),
    [dispatch.readyOrders, search],
  )
  const datable = tab !== 'dispatch'

  return (
    <div className="flex flex-col gap-5">
      <FilterBar
        tabs={tabs}
        tabValue={tab}
        onTabChange={value => setTab(value as TabValue)}
        tabsLabel="Post-print station queues"
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder={datable ? 'Search job #, description' : 'Search order #, customer'}
        period={datable ? period : undefined}
        onPeriodChange={datable ? setPeriod : undefined}
      />
      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === 'assembly' ? (
          <AssemblyQueueTable brand={brand} jobs={visible.assembly} batchNumbers={batchNumbers} />
        ) : null}
        {tab === 'finishing' ? (
          <FinishingQueueTable brand={brand} jobs={visible.finishing} batchNumbers={batchNumbers} />
        ) : null}
        {tab === 'qc' ? (
          <QcQueueTable brand={brand} jobs={visible.qc} batchNumbers={batchNumbers} />
        ) : null}
        {tab === 'packaging' ? (
          <PackagingQueueTable brand={brand} jobs={visible.packaging} batchNumbers={batchNumbers} />
        ) : null}
        {tab === 'dispatch' ? (
          dispatch.error ? (
            <p role="alert" className="bg-danger-subtle text-danger rounded-md px-3 py-2 text-sm">
              {dispatch.error}
            </p>
          ) : (
            <DispatchQueueTable
              brand={brand}
              dispatches={dispatch.dispatches}
              readyOrders={readyOrders}
              orderNumbers={dispatch.orderNumbers}
            />
          )
        ) : null}
      </div>
    </div>
  )
}
