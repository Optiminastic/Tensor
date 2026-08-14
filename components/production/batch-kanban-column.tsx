'use client'

import { useDroppable } from '@dnd-kit/core'
import type { JSX } from 'react'

import { BatchKanbanCard } from '@/components/production/batch-kanban-card'
import type { BatchRecord, BatchStatus } from '@/components/production/types'
import { cn } from '@/lib/utils'

interface BatchKanbanColumnProps {
  brand: string
  status: BatchStatus
  label: string
  batches: BatchRecord[]
  droppable: boolean
}

/** One status column, 25% of the board's width (four columns total - matches
 * BatchStatus having exactly four values). Every card is draggable, including
 * Draft's - but Draft itself doesn't accept drops: the backend has no way to
 * set a batch back to pending_approval, it's only ever the auto-created
 * starting state.
 *
 * All four columns are the same fixed height and scroll their own cards. A
 * machine accumulates Completed batches indefinitely while the other three
 * columns hold a handful at most, so sizing to content made one column run
 * hundreds of cards long, pushed the page height with it, and left the other
 * three as short stubs beside a wall of Completed - and reaching Draft again
 * meant scrolling the whole page back up past all of it.
 *
 * h-full rather than a fixed height: the page is exactly one viewport tall
 * (see the machine page's h-dvh) and the columns take whatever is left below
 * the machine header, so the four headers stay on screen together and the
 * overflow is confined to whichever column actually has it. */
export function BatchKanbanColumn({
  brand,
  status,
  label,
  batches,
  droppable,
}: BatchKanbanColumnProps): JSX.Element {
  const { setNodeRef, isOver } = useDroppable({ id: status, disabled: !droppable })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'border-border bg-surface-muted flex h-full w-1/4 flex-col gap-2 rounded-lg border p-2.5 transition-colors',
        droppable && isOver && 'border-accent bg-accent-subtle',
      )}
    >
      <div className="flex shrink-0 items-center justify-between px-1">
        <span className="text-foreground text-xs font-semibold tracking-wide uppercase">
          {label}
        </span>
        <span className="text-muted-foreground font-mono text-xs tabular-nums">
          {batches.length}
        </span>
      </div>
      {/* min-h-0 is load-bearing: without it this flex child refuses to shrink
       * below its content height, so overflow-y-auto never engages and the
       * column grows the page exactly as before. */}
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
        {batches.length === 0 ? (
          <p className="text-muted-foreground px-1 text-xs">No batches.</p>
        ) : (
          batches.map(batch => (
            <BatchKanbanCard
              key={batch.id}
              brand={brand}
              batch={batch}
              expandable={status === 'completed'}
            />
          ))
        )}
      </div>
    </div>
  )
}
