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
 * starting state. */
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
        'border-border bg-surface-muted flex min-h-28 w-1/4 flex-col gap-2 rounded-lg border p-2.5 transition-colors',
        droppable && isOver && 'border-accent bg-accent-subtle',
      )}
    >
      <div className="flex items-center justify-between px-1">
        <span className="text-foreground text-xs font-semibold tracking-wide uppercase">
          {label}
        </span>
        <span className="text-muted-foreground font-mono text-xs tabular-nums">
          {batches.length}
        </span>
      </div>
      <div className="flex flex-col gap-2">
        {batches.length === 0 ? (
          <p className="text-muted-foreground px-1 text-xs">No batches.</p>
        ) : (
          batches.map(batch => <BatchKanbanCard key={batch.id} brand={brand} batch={batch} />)
        )}
      </div>
    </div>
  )
}
