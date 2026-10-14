'use client'

import { type JSX, useMemo, useState } from 'react'

import { supplyDesignJobModelAction } from '@/app/dashboard/[brand]/designs/non-dnp/actions'
import { ChangeList } from '@/components/production/change-list'
import { JobModelUploadButton } from '@/components/production/job-model-upload-button'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
} from '@/components/ui/table'
import type { ProductionJob } from '@/lib/validators/production'

interface NonDnpTableProps {
  jobs: ProductionJob[]
}

type Tab = 'needs' | 'changed'

/**
 * The designer's work queue: jobs whose customer's window has closed and that
 * still need a 3MF from a person.
 *
 * EVERY ROW ANSWERS "WHAT DO I BUILD FROM?" WITHOUT A CLICK, because that is
 * the only question here. A job the customer corrected shows what moved; one
 * they left alone says so plainly, and the designer works from the order. Both
 * arrive with the list, so neither costs a request.
 *
 * Its own component rather than a mode of job-queue-table.tsx: that one is
 * already long, carries its own tabs and filters, and shares no column with
 * this but the job number.
 */
export function NonDnpTable({ jobs }: NonDnpTableProps): JSX.Element {
  const [tab, setTab] = useState<Tab>('needs')

  const { needs, changed } = useMemo(
    () => ({
      needs: jobs.filter(job => !job.print_file_id),
      changed: jobs.filter(job => job.issue_reason === 'design_file_stale'),
    }),
    [jobs],
  )
  const shown = tab === 'needs' ? needs : changed

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <TabButton active={tab === 'needs'} count={needs.length} onClick={() => setTab('needs')}>
          Needs a file
        </TabButton>
        <TabButton
          active={tab === 'changed'}
          count={changed.length}
          onClick={() => setTab('changed')}
        >
          Changed since upload
        </TabButton>
      </div>

      {shown.length === 0 ? (
        <Card className="text-muted-foreground px-4 py-10 text-center text-sm">
          {/* The list emptying IS the signal that the work is done, so it says
              that rather than "no results". */}
          {tab === 'needs'
            ? 'Nothing is waiting for a design file.'
            : 'No customer has changed an item since its file was made.'}
        </Card>
      ) : (
        <Card className="overflow-x-auto p-0">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeaderCell>Job</TableHeaderCell>
                <TableHeaderCell>Product</TableHeaderCell>
                <TableHeaderCell>Qty</TableHeaderCell>
                <TableHeaderCell>Colours</TableHeaderCell>
                <TableHeaderCell>Envelope</TableHeaderCell>
                <TableHeaderCell>Build from</TableHeaderCell>
                <TableHeaderCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {shown.map(job => (
                <TableRow key={job.id}>
                  <TableCell>
                    <span className="font-mono text-xs">{job.job_number}</span>
                    {job.sku ? (
                      <span className="text-subtle-foreground block text-[11px]">{job.sku}</span>
                    ) : null}
                  </TableCell>
                  <TableCell className="max-w-[18rem]">{job.product_name ?? '—'}</TableCell>
                  <TableCell numeric>{job.quantity}</TableCell>
                  <TableCell>
                    {job.colour ? (
                      <span className="text-sm">{job.colour}</span>
                    ) : (
                      <span className="text-subtle-foreground text-xs">not recorded</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {/* The dimensional constraint, which the designer needs
                        before modelling rather than after. */}
                    <Envelope job={job} />
                  </TableCell>
                  <TableCell className="max-w-[22rem]">
                    {job.personalisation_changes.length > 0 ? (
                      <ChangeList changes={job.personalisation_changes} />
                    ) : (
                      <span className="text-muted-foreground text-xs">
                        No changes — build from the order.
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <JobModelUploadButton
                      jobId={job.id}
                      hasModel={Boolean(job.print_file_id)}
                      action={supplyDesignJobModelAction}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  )
}

function Envelope({ job }: { job: ProductionJob }): JSX.Element {
  const dims = [job.bbox_x_mm, job.bbox_y_mm, job.bbox_z_mm]
  if (dims.some(d => d === null || d === undefined)) {
    return <span className="text-subtle-foreground text-xs">—</span>
  }
  return (
    <span className="font-mono text-xs tabular-nums">
      {dims.map(d => Number(d).toFixed(0)).join(' × ')} mm
    </span>
  )
}

interface TabButtonProps {
  active: boolean
  count: number
  onClick: () => void
  children: React.ReactNode
}

function TabButton({ active, count, onClick, children }: TabButtonProps): JSX.Element {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        active
          ? 'border-foreground text-foreground rounded-full border px-3 py-1.5 text-sm'
          : 'border-border/70 text-muted-foreground hover:text-foreground rounded-full border px-3 py-1.5 text-sm'
      }
    >
      {children}
      <span className="text-subtle-foreground ml-1.5 font-mono text-xs tabular-nums">{count}</span>
    </button>
  )
}
