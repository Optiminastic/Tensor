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
import { useQueryTab } from '@/hooks/use-query-tab'

interface JobQueueTableProps {
  brand: string
  jobs: ProductionJobQueueItem[]
}

const COLUMNS = [
  'Job',
  'SKU',
  'Description',
  'Qty',
  'Status',
  'Personalisation',
  'Packaging',
  'Priority',
  'Created',
]

/**
 * The queue answers three questions and no others.
 *
 * It used to carry a tab per status, which put Queued, In Progress, On Hold and
 * Failed beside each other as though a person moved between them - they do not.
 * What the floor actually asks is: everything, the jobs that are NOT planks and
 * so need somebody to supply a model or pick a part, and what is finished.
 */
const NON_DNP_TAB = 'non-dnp'
const COMPLETED_TAB = 'completed'
const PERSONALISATION_OPTIONS = (
  Object.keys(PERSONALISATION_STATUS_CONFIG) as PersonalisationStatus[]
).map(status => ({ value: status, label: PERSONALISATION_STATUS_CONFIG[status].label }))
const PACKAGING_OPTIONS = (Object.keys(PACKAGING_STATUS_CONFIG) as PackagingStatus[]).map(
  status => ({ value: status, label: PACKAGING_STATUS_CONFIG[status].label }),
)

function matchesSearch(job: ProductionJobQueueItem, search: string): boolean {
  if (!search) return true
  // The customer's own two names are included, because that is what somebody
  // holding a plank actually has to search by - personalisationName is where
  // the importer joins them ("HABEEB & FARSANA"), so either half matches.
  // The SKU too: it is the only term that separates products whose names read
  // alike, so "DNPF" finds the photo frames and "SCWL" the lit combos.
  const haystack =
    `${job.jobNumber} ${job.description} ${job.personalisationName ?? ''} ${job.sku ?? ''}`
      .trim()
      .toLowerCase()
  return haystack.includes(search.trim().toLowerCase())
}

export function JobQueueTable({ brand, jobs }: JobQueueTableProps): JSX.Element {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useQueryTab<string>('status', '')
  const [personalisation, setPersonalisation] = useState('')
  const [packaging, setPackaging] = useState('')
  // All time by default - see the same note on OrdersTable.
  const [period, setPeriod] = useState<PeriodValue>(ALL_TIME_PERIOD)

  const periodRange = useMemo(() => resolvePeriod(period, new Date()), [period])

  const tabs: TabItem[] = useMemo(
    () => [
      { value: '', label: 'All', count: jobs.length },
      {
        value: NON_DNP_TAB,
        label: 'Non-DNP',
        // Counted the same way the tab filters, or the number promises jobs
        // the tab will not show.
        count: jobs.filter(j => !j.isGenerated).length,
      },
      {
        value: COMPLETED_TAB,
        label: 'Completed',
        count: jobs.filter(j => j.status === COMPLETED_TAB).length,
      },
    ],
    [jobs],
  )

  const filtered = useMemo(
    () =>
      jobs.filter(
        job =>
          matchesSearch(job, search) &&
          matchesJobTab(job, status) &&
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
        searchPlaceholder="Search job #, name, description"
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

/**
 * Which tab a job belongs to.
 *
 * Non-DNP is the useful one: on a floor that is mostly Dual Name Planks, the
 * jobs worth looking at are the ones Tensor cannot render for you.
 */
function matchesJobTab(job: ProductionJobQueueItem, tab: string): boolean {
  if (!tab) return true
  if (tab === NON_DNP_TAB) return !job.isGenerated
  return job.status === tab
}
