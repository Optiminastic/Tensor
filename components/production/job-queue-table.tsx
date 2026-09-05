'use client'

import { useMemo, useState, type JSX } from 'react'

import {
  ALL_TIME_PERIOD,
  isWithinDateRange,
  type PeriodValue,
  resolvePeriod,
} from '@/components/production/date-range'
import { FilterBar } from '@/components/production/filter-bar'
import { JobQueueRow } from '@/components/production/job-queue-row'
import {
  PACKAGING_STATUS_CONFIG,
  PERSONALISATION_STATUS_CONFIG,
  QUEUE_STATUS_CONFIG,
} from '@/components/production/status-config'
import { TablePagination } from '@/components/production/table-pagination'
import type {
  PackagingStatus,
  PersonalisationStatus,
  ProductionJobQueueItem,
  QueueStatus,
} from '@/components/production/types'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/table'
import type { TabItem } from '@/components/ui/tabs'
import { usePagination } from '@/hooks/use-pagination'

interface JobQueueTableProps {
  brand: string
  jobs: ProductionJobQueueItem[]
}

const COLUMNS = [
  'Job',
  'Description',
  'Qty',
  'Status',
  'Personalisation',
  'Packaging',
  'Priority',
  'Created',
]

const STATUSES = Object.keys(QUEUE_STATUS_CONFIG) as QueueStatus[]
const PERSONALISATION_OPTIONS = (
  Object.keys(PERSONALISATION_STATUS_CONFIG) as PersonalisationStatus[]
).map(status => ({ value: status, label: PERSONALISATION_STATUS_CONFIG[status].label }))
const PACKAGING_OPTIONS = (Object.keys(PACKAGING_STATUS_CONFIG) as PackagingStatus[]).map(
  status => ({ value: status, label: PACKAGING_STATUS_CONFIG[status].label }),
)

function matchesSearch(job: ProductionJobQueueItem, search: string): boolean {
  if (!search) return true
  const haystack = `${job.jobNumber} ${job.description}`.trim().toLowerCase()
  return haystack.includes(search.trim().toLowerCase())
}

export function JobQueueTable({ brand, jobs }: JobQueueTableProps): JSX.Element {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [personalisation, setPersonalisation] = useState('')
  const [packaging, setPackaging] = useState('')
  // All time by default - see the same note on OrdersTable.
  const [period, setPeriod] = useState<PeriodValue>(ALL_TIME_PERIOD)

  const periodRange = useMemo(() => resolvePeriod(period, new Date()), [period])

  const tabs: TabItem[] = useMemo(
    () => [
      { value: '', label: 'All', count: jobs.length },
      ...STATUSES.map(s => ({
        value: s,
        label: QUEUE_STATUS_CONFIG[s].label,
        count: jobs.filter(j => j.status === s).length,
      })),
    ],
    [jobs],
  )

  const filtered = useMemo(
    () =>
      jobs.filter(
        job =>
          matchesSearch(job, search) &&
          (!status || job.status === status) &&
          (!personalisation || job.personalisation === personalisation) &&
          (!packaging || job.packaging === packaging) &&
          isWithinDateRange(job.createdAt, periodRange),
      ),
    [jobs, search, status, personalisation, packaging, periodRange],
  )
  const page = usePagination(filtered)

  return (
    <div className="flex flex-col gap-4">
      <FilterBar
        tabs={tabs}
        tabValue={status}
        onTabChange={setStatus}
        tabsLabel="Filter jobs by status"
        filters={[
          {
            label: 'Personalisation',
            value: personalisation,
            onChange: setPersonalisation,
            options: PERSONALISATION_OPTIONS,
          },
          {
            label: 'Packaging',
            value: packaging,
            onChange: setPackaging,
            options: PACKAGING_OPTIONS,
          },
        ]}
        searchValue={search}
        onSearchChange={setSearch}
        period={period}
        onPeriodChange={setPeriod}
        searchPlaceholder="Search job #, description"
      />
      <Card>
        <Table>
          <TableHead>
            <TableRow>
              {COLUMNS.map(column => (
                <TableHeaderCell key={column}>{column}</TableHeaderCell>
              ))}
              <TableHeaderCell className="text-right">Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={COLUMNS.length + 1}
                  className="text-muted-foreground text-center text-sm"
                >
                  No jobs match these filters.
                </TableCell>
              </TableRow>
            ) : (
              page.items.map(job => <JobQueueRow key={job.id} brand={brand} job={job} />)
            )}
          </TableBody>
        </Table>
        <TablePagination page={page} noun="jobs" />
      </Card>
    </div>
  )
}
