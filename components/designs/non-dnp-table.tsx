'use client'

import { ChevronRight } from 'lucide-react'
import { type JSX, useMemo, useState } from 'react'

import { DesignUploadDialog } from '@/components/designs/design-upload-dialog'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { ProductionJob } from '@/lib/validators/production'

interface NonDnpTableProps {
  jobs: ProductionJob[]
  /** The filaments this shop can print, for naming a colour in a file. */
  colours: string[]
}

type Tab = 'needs' | 'changed'

/**
 * The designer's work queue: jobs whose customer's window has closed and that
 * still need a 3MF from a person.
 *
 * THE ROW IS THE PRODUCT, nothing else. A designer scanning this list is
 * deciding what to draw next, and job numbers, quantities and envelopes are
 * not how anyone chooses. Opening a row shows the only thing that matters -
 * what the customer actually asked for.
 */
export function NonDnpTable({ jobs, colours }: NonDnpTableProps): JSX.Element {
  const [tab, setTab] = useState<Tab>('needs')
  const [open, setOpen] = useState<string | null>(null)

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
        <Card className="divide-border/60 divide-y p-0">
          {shown.map(job => (
            <JobRow
              key={job.id}
              job={job}
              colours={colours}
              expanded={open === job.id}
              onToggle={() => setOpen(open === job.id ? null : job.id)}
            />
          ))}
        </Card>
      )}
    </div>
  )
}

interface JobRowProps {
  job: ProductionJob
  colours: string[]
  expanded: boolean
  onToggle: () => void
}

function JobRow({ job, colours, expanded, onToggle }: JobRowProps): JSX.Element {
  const changed = job.personalisation_changes
  const fields = customerFields(job)

  return (
    <div>
      <div className="flex items-center gap-3 px-4 py-3">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <ChevronRight
            aria-hidden
            className={cn(
              'text-subtle-foreground size-4 shrink-0 transition-transform',
              expanded && 'rotate-90',
            )}
          />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm">{job.product_name ?? 'Unnamed product'}</span>
            {/* Which production job this is, and which order it came off.
                A designer about to draw something has to be able to say
                what they drew it for. */}
            <span className="text-subtle-foreground block truncate font-mono text-[11px]">
              {job.job_number}
              {job.order_number ? ` · ${job.order_number}` : ''}
              {job.part_role && job.part_role !== 'body' ? ` · ${job.part_role}` : ''}
            </span>
          </span>
          {changed.length > 0 ? (
            <span className="bg-warning-subtle text-warning shrink-0 rounded-full px-2 py-0.5 text-[11px]">
              {changed.length} changed
            </span>
          ) : null}
        </button>

        <DesignUploadDialog
          jobId={job.id}
          jobNumber={job.job_number}
          productName={job.product_name ?? 'this product'}
          hasModel={Boolean(job.print_file_id)}
          colours={colours}
        />
      </div>

      {expanded ? (
        <div className="bg-surface-muted/50 flex flex-col gap-3 px-4 pb-4 pl-11">
          <p className="text-subtle-foreground text-[11px] font-medium tracking-wide uppercase">
            {changed.length === 0
              ? 'What the customer ordered'
              : 'What the customer ordered, and what they corrected in their 30 minutes'}
          </p>

          {fields.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              The customer gave no customisation for this item.
            </p>
          ) : (
            <dl className="grid gap-x-8 gap-y-2.5 sm:grid-cols-2">
              {fields.map(field => (
                <div key={field.label} className="flex flex-col gap-0.5">
                  <dt className="text-subtle-foreground text-[11px] tracking-wide uppercase">
                    {field.label}
                  </dt>
                  <dd className="text-sm break-words">
                    {field.was === undefined ? (
                      <span className="text-foreground">{field.value}</span>
                    ) : (
                      // BOTH VALUES, on the field itself rather than in a
                      // list of their own. The designer builds from the new
                      // one and needs the old one only to see what moved, so
                      // separating them into two blocks made them read the
                      // same field twice.
                      <span className="flex flex-wrap items-center gap-1.5">
                        <span className="text-muted-foreground line-through">{field.was}</span>
                        <span className="text-subtle-foreground">→</span>
                        <span className="text-foreground font-medium">{field.value}</span>
                        <span className="text-warning text-[11px]">changed</span>
                      </span>
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          )}

          {changed.length === 0 ? (
            <p className="text-subtle-foreground text-xs">
              Nothing was changed after the order — build from these values.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}

interface CustomerField {
  label: string
  value: string
  /** What it said at checkout, when the customer later changed it. */
  was?: string
}

/**
 * Exactly what the customer filled in at checkout, and nothing else.
 *
 * The variant comes first because for several of these products it IS the
 * customisation - a 3D Name Plank's two colours are "RED / BLUE" in the
 * variant, not in the properties, so a list of properties alone would leave
 * the designer without half the brief.
 *
 * Shopify's own plumbing is dropped: `_`-prefixed keys are state the
 * storefront carries for itself, never something a person typed.
 */
function customerFields(job: ProductionJob): CustomerField[] {
  // Keyed on the label the customer saw, which is what the diff is keyed on
  // too - so a field that moved during the window carries both values.
  const before = new Map(job.personalisation_changes.map(c => [c.label, c.from]))

  const out: CustomerField[] = []
  if (job.variant_title) {
    out.push({ label: 'Variant', value: job.variant_title })
  }
  for (const prop of job.personalisation_properties ?? []) {
    if (prop.name.startsWith('_') || prop.value.trim() === '') continue
    out.push({ label: prop.name, value: prop.value, was: before.get(prop.name) })
  }
  // A colour change is recorded against the job rather than among the
  // properties, so it has no field to attach to and is appended.
  for (const change of job.personalisation_changes) {
    if (out.some(f => f.label === change.label)) continue
    out.push({ label: change.label, value: change.to, was: change.from })
  }
  return out
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
