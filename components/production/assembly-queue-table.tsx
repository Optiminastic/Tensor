'use client'

import type { JSX } from 'react'

import { batchLabel, type BatchNumbers } from '@/components/production/batch-label'
import { ReprintDialog } from '@/components/production/reprint-dialog'
import {
  AdvanceArrow,
  leavingClasses,
  RowCheckbox,
  SelectionBar,
} from '@/components/production/station-row-controls'
import { TablePagination } from '@/components/production/table-pagination'
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

const COLUMNS = ['Job', 'Batch', 'Description', 'Qty', 'Customer', 'Created']

interface AssemblyQueueTableProps {
  brand: string
  jobs: ProductionJob[]
  batchNumbers: BatchNumbers
}

/**
 * Jobs that came off the printer and are waiting on assembly.
 *
 * NO ISSUE DIALOG HERE, only reprint. At assembly a bad part is a part to
 * print again, not a note to leave on a job somebody else will pick up - and
 * the reprint already takes a reason, so raising an issue as well recorded the
 * same problem twice in two places. The later stations keep both, because by
 * then a problem may be worth flagging without scrapping the part.
 *
 * THE ARROW REPLACED THE CHECKLIST DIALOG as the ordinary way through. Most of
 * this shop's work does not need four fields filled in per job - somebody
 * finishes a tray and moves the tray on - and a dialog that has to be
 * dismissed hundreds of times a day stops being filled in honestly, which is
 * worse than not having it. The issue and reprint paths are still here for
 * when something is actually wrong.
 */
export function AssemblyQueueTable({
  brand,
  jobs,
  batchNumbers,
}: AssemblyQueueTableProps): JSX.Element {
  // PAGED, because this queue reached fifteen hundred rows on the live shop
  // and the browser rendered every one of them. Client-side: the jobs are
  // already here, so this is about what the DOM carries rather than what the
  // network does.
  const page = usePagination(jobs)
  // Selection is scoped to the page on screen. "Select all" reaching rows
  // somebody cannot see is how a tray of twenty becomes two hundred.
  const advance = useStationAdvance(brand, 'assembly', page.items)

  return (
    <div className="flex flex-col gap-3">
      <SelectionBar
        count={advance.selected.size}
        nextStation="Finishing"
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
                  <span className="font-mono text-sm">{job.job_number}</span>
                </TableCell>
                <TableCell className="text-muted-foreground font-mono text-sm whitespace-nowrap">
                  {batchLabel(job.batch_id, batchNumbers)}
                </TableCell>
                <TableCell>{job.description}</TableCell>
                <TableCell numeric>{job.quantity}</TableCell>
                <TableCell className="text-muted-foreground">{job.customer_name ?? '—'}</TableCell>
                <TableCell className="text-muted-foreground whitespace-nowrap">
                  {dateTime(job.created_at)}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    {/* Assembly is where a bad part is usually first handled,
                        so the reprint belongs here rather than only on the
                        machine board. Same /fail path as everywhere else: the
                        reason is recorded and the clone re-enters normal
                        batching at urgent priority. */}
                    <ReprintDialog
                      brand={brand}
                      job={{
                        id: job.id,
                        jobNumber: job.job_number,
                        productName: job.product_name ?? null,
                        printFileID: job.print_file_id ?? null,
                      }}
                    />
                    <AdvanceArrow
                      onClick={() => void advance.advanceOne(job.id)}
                      disabled={advance.busy}
                      label={`Move ${job.job_number} on to Finishing`}
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
