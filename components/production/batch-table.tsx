'use client'

import { useMemo, useState, type JSX } from 'react'

import { BatchTableGrid } from '@/components/production/batch-table-grid'
import {
  ALL_TIME_PERIOD,
  isWithinDateRange,
  type PeriodValue,
  resolvePeriod,
} from '@/components/production/date-range'
import { FilterBar } from '@/components/production/filter-bar'
import { BATCH_STATUS_CONFIG } from '@/components/production/status-config'
import { TablePagination } from '@/components/production/table-pagination'
import type { BatchRecord, BatchStatus } from '@/components/production/types'
import type { TabItem } from '@/components/ui/tabs'
import { usePagination } from '@/hooks/use-pagination'

interface BatchTableProps {
  brand: string
  batches: BatchRecord[]
}

const STATUSES = Object.keys(BATCH_STATUS_CONFIG) as BatchStatus[]

/**
 * The tab value for "carries priority work".
 *
 * It shares the strip with the statuses even though it asks a different KIND of
 * question, for the same reason the Orders strip carries "No jobs": an operator
 * opening this page wants to know what to print next, and a bed somebody paid
 * to jump the queue is the answer. Cannot collide with a status - those come
 * from BATCH_STATUS_CONFIG's keys.
 */
const PRIORITY_TAB = 'priority'
const SHORTAGE_OPTIONS = [
  { value: 'yes', label: 'Shortage' },
  { value: 'no', label: 'No shortage' },
]

function matchesSearch(batch: BatchRecord, search: string): boolean {
  if (!search) return true
  return batch.batchNumber.toLowerCase().includes(search.trim().toLowerCase())
}

/** Whether a batch belongs under the selected tab. '' is All. */
function matchesTab(batch: BatchRecord, tab: string): boolean {
  if (!tab) return true
  if (tab === PRIORITY_TAB) return batch.hasPriority
  return batch.status === tab
}

function matchesShortage(batch: BatchRecord, shortage: string): boolean {
  if (!shortage) return true
  return shortage === 'yes' ? batch.materialShortage : !batch.materialShortage
}

export function BatchTable({ brand, batches }: BatchTableProps): JSX.Element {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [shortage, setShortage] = useState('')
  // All time by default - see the same note on OrdersTable.
  const [period, setPeriod] = useState<PeriodValue>(ALL_TIME_PERIOD)

  const periodRange = useMemo(() => resolvePeriod(period, new Date()), [period])

  const tabs: TabItem[] = useMemo(
    () => [
      { value: '', label: 'All', count: batches.length },
      // First after All, not last: these are the beds with a promised date on
      // them, so the tab is worth reaching for before the status filters.
      {
        value: PRIORITY_TAB,
        label: 'Priority',
        count: batches.filter(b => b.hasPriority).length,
      },
      ...STATUSES.map(s => ({
        value: s,
        label: BATCH_STATUS_CONFIG[s].label,
        count: batches.filter(b => b.status === s).length,
      })),
    ],
    [batches],
  )

  const filtered = useMemo(
    () =>
      batches.filter(
        batch =>
          matchesSearch(batch, search) &&
          matchesTab(batch, status) &&
          matchesShortage(batch, shortage) &&
          isWithinDateRange(batch.createdAt, periodRange),
      ),
    [batches, search, status, shortage, periodRange],
  )
  const page = usePagination(filtered)

  return (
    <div className="flex flex-col gap-4">
      <FilterBar
        tabs={tabs}
        tabValue={status}
        onTabChange={setStatus}
        tabsLabel="Filter batches by status or priority"
        filters={[
          { label: 'Material', value: shortage, onChange: setShortage, options: SHORTAGE_OPTIONS },
        ]}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search batch #"
        period={period}
        onPeriodChange={setPeriod}
      />
      <BatchTableGrid
        brand={brand}
        batches={page.items}
        footer={<TablePagination page={page} noun="batches" />}
      />
    </div>
  )
}
