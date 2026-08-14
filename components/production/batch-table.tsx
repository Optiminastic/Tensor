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
import type { BatchRecord, BatchStatus } from '@/components/production/types'
import type { TabItem } from '@/components/ui/tabs'

interface BatchTableProps {
  brand: string
  batches: BatchRecord[]
}

const STATUSES = Object.keys(BATCH_STATUS_CONFIG) as BatchStatus[]
const SHORTAGE_OPTIONS = [
  { value: 'yes', label: 'Shortage' },
  { value: 'no', label: 'No shortage' },
]

function matchesSearch(batch: BatchRecord, search: string): boolean {
  if (!search) return true
  return batch.batchNumber.toLowerCase().includes(search.trim().toLowerCase())
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
          (!status || batch.status === status) &&
          matchesShortage(batch, shortage) &&
          isWithinDateRange(batch.createdAt, periodRange),
      ),
    [batches, search, status, shortage, periodRange],
  )

  return (
    <div className="flex flex-col gap-4">
      <FilterBar
        tabs={tabs}
        tabValue={status}
        onTabChange={setStatus}
        tabsLabel="Filter batches by status"
        filters={[
          { label: 'Material', value: shortage, onChange: setShortage, options: SHORTAGE_OPTIONS },
        ]}
        searchValue={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search batch #"
        period={period}
        onPeriodChange={setPeriod}
      />
      <BatchTableGrid brand={brand} batches={filtered} />
    </div>
  )
}
