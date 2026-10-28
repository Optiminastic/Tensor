import type { JSX } from 'react'

import { batchLabel, type BatchNumbers } from '@/components/production/batch-label'
import {
  AdvanceArrow,
  IssueTag,
  issuesFirst,
  leavingClasses,
  RowCheckbox,
  SelectionBar,
} from '@/components/production/station-row-controls'
import { QC_STATUS_CONFIG } from '@/components/production/status-config'
import { TablePagination } from '@/components/production/table-pagination'
import { TonePill } from '@/components/production/tone-pill'
import type { QcStatus } from '@/components/production/types'
import { useStationAdvance } from '@/components/production/use-station-advance'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/table'
import { usePagination } from '@/hooks/use-pagination'
import { dateTime } from '@/lib/format'
import type { ProductionJob } from '@/lib/validators/production'
import type { StationIssuesByJob } from '@/lib/validators/station-issues'

const COLUMNS = ['Job', 'Batch', 'Description', 'Qty', 'QC', 'Customer', 'Created']

interface PackagingQueueTableProps {
  brand: string
  jobs: ProductionJob[]
  batchNumbers: BatchNumbers
  /** What the floor flagged, keyed by job id. See lib/validators/station-issues. */
  issues: StationIssuesByJob
}

/** Jobs that passed QC and are waiting to be packed - qc_status = passed,
 * packaging_status = pending (see the Packaging page's Packaging tab). */
export function PackagingQueueTable({
  brand,
  jobs,
  batchNumbers,
  issues,
}: PackagingQueueTableProps): JSX.Element {
  // PAGED: this queue reached fifteen hundred rows on the live shop and
  // the browser rendered every one of them.
  // Sorted BEFORE paging: a flagged job pushed to page four is a flagged
  // job nobody sees.
  const page = usePagination(issuesFirst(jobs, issues))
  // Selection is scoped to the page on screen - "select all" reaching rows
  // nobody can see is how a tray of twenty becomes two hundred.
  const advance = useStationAdvance(brand, 'packaging', page.items)
  return (
    <div className="flex flex-col gap-3">
      <SelectionBar
        count={advance.selected.size}
        nextStation="Dispatch"
        busy={advance.busy}
        onAdvance={() => void advance.advanceSelected()}
        onClear={advance.clear}
      />

      {advance.error ? (
        <p role="alert" className="text-danger text-sm text-pretty">
          {advance.error}
        </p>
      ) : null}

      <Card>
        <Table>
          <TableHead>
            <TableRow>
              <TableHeaderCell className="w-10">
                <RowCheckbox
                  checked={advance.allSelected}
                  onChange={advance.toggleAll}
                  label="Select every job shown"
                />
              </TableHeaderCell>
              {COLUMNS.map(column => (
                <TableHeaderCell key={column}>{column}</TableHeaderCell>
              ))}
              <TableHeaderCell className="text-right">Actions</TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {page.items.map(job => (
              <TableRow key={job.id} className={leavingClasses(advance.leaving.has(job.id))}>
                <TableCell>
                  <RowCheckbox
                    checked={advance.selected.has(job.id)}
                    onChange={() => advance.toggle(job.id)}
                    label={`Select ${job.job_number}`}
                  />
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  <div className="flex flex-col items-start gap-1">
                    <span className="font-mono text-sm">{job.job_number}</span>
                    <IssueTag issue={issues[job.id]} />
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground font-mono text-sm whitespace-nowrap">
                  {batchLabel(job.batch_id, batchNumbers)}
                </TableCell>
                <TableCell>{job.description}</TableCell>
                <TableCell numeric>{job.quantity}</TableCell>
                <TableCell>
                  <TonePill {...QC_STATUS_CONFIG[job.qc_status as QcStatus]} />
                </TableCell>
                <TableCell className="text-muted-foreground">{job.customer_name ?? '—'}</TableCell>
                <TableCell className="text-muted-foreground whitespace-nowrap">
                  {dateTime(job.created_at)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end">
                    <AdvanceArrow
                      onClick={() => void advance.advanceOne(job.id)}
                      disabled={advance.busy}
                      label={`Move ${job.job_number} on to Dispatch`}
                    />
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <TablePagination page={page} noun="jobs" />
      </Card>
    </div>
  )
}
