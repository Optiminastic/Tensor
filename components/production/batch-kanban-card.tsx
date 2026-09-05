'use client'

import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { AlertTriangle, ChevronDown } from 'lucide-react'
import { useState, type JSX } from 'react'

import { BatchDetailSheet } from '@/components/production/batch-detail-sheet'
import { batchFailure } from '@/components/production/batch-label'
import { CompletedBatchJobs } from '@/components/production/completed-batch-jobs'
import { FailureNote } from '@/components/production/failure-note'
import type { BatchRecord } from '@/components/production/types'
import { countdown, dateTime } from '@/lib/format'
import { cn } from '@/lib/utils'

interface BatchKanbanCardProps {
  brand: string
  batch: BatchRecord
  // Completed batches expand in place to list their jobs, each with the
  // Done/Reprint decision that follows a finished print. Other columns have no
  // per-job decision to make, so their cards stay compact.
  expandable?: boolean
}

/** One batch on the board - always draggable, including out of Draft (see
 * machine-queue-board.tsx's handleDragEnd for how a Draft card's drop is
 * routed through the real approve flow rather than a plain status PATCH).
 * Only the header is draggable: an expanded job list has its own links and
 * buttons, which a drag handle would swallow. */
export function BatchKanbanCard({ brand, batch, expandable }: BatchKanbanCardProps): JSX.Element {
  const [open, setOpen] = useState(false)
  const [detailOpen, setDetailOpen] = useState(false)
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: batch.id,
  })
  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined
  const failure = batchFailure(batch)

  return (
    <div
      className={cn(
        'border-border bg-surface flex flex-col rounded-md border shadow-xs transition-colors',
        'hover:border-border-strong',
        isDragging && 'z-10 opacity-60',
        failure && 'border-l-danger bg-danger-subtle/40 border-l-2',
      )}
      style={style}
    >
      <div
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        // Opens the detail panel rather than navigating away: the board is
        // where an operator is working, and a full page load to read one
        // batch's plate loses their place on it. The panel still links
        // through to the page for anything it does not carry.
        onClick={() => setDetailOpen(true)}
        className="flex cursor-grab flex-col gap-2 p-3 active:cursor-grabbing"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-sm font-medium">{batch.batchNumber}</span>
          <div className="flex items-center gap-1.5">
            {batch.materialShortage ? (
              <span title="Filament shortage" className="text-warning">
                <AlertTriangle className="size-3.5" aria-hidden />
              </span>
            ) : null}
            {expandable ? (
              <button
                type="button"
                aria-expanded={open}
                aria-label={open ? 'Hide jobs' : 'Show jobs'}
                // Stops the card's drag and its navigate-to-batch click.
                onPointerDown={event => event.stopPropagation()}
                onClick={event => {
                  event.stopPropagation()
                  setOpen(prev => !prev)
                }}
                className="text-muted-foreground hover:text-foreground -m-1 cursor-pointer p-1"
              >
                <ChevronDown
                  className={cn('size-3.5 transition-transform', open && 'rotate-180')}
                  aria-hidden
                />
              </button>
            ) : null}
          </div>
        </div>
        <FailureNote reason={failure?.reason} label={failure?.label} />
        <p className="text-muted-foreground text-xs">
          {batch.jobsCount ?? 0} jobs
          {batch.totalPrintTimeMinutes !== null
            ? ` · ${countdown(batch.totalPrintTimeMinutes * 60)}`
            : ''}
          {batch.totalFilamentGrams !== null ? ` · ${Math.round(batch.totalFilamentGrams)} g` : ''}
        </p>
        <p className="text-subtle-foreground text-xs">Created {dateTime(batch.createdAt)}</p>
      </div>
      {expandable && open ? <CompletedBatchJobs brand={brand} batchId={batch.id} /> : null}
      <BatchDetailSheet
        brand={brand}
        batchId={batch.id}
        batchNumber={batch.batchNumber}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  )
}
