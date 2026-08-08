'use client'

import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { AlertTriangle } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { JSX } from 'react'

import type { BatchRecord } from '@/components/production/types'
import { countdown } from '@/lib/format'
import { cn } from '@/lib/utils'

interface BatchKanbanCardProps {
  brand: string
  batch: BatchRecord
  draggable: boolean
}

/** One batch on the board. Draggable unless it's still a Draft (pending_approval
 * isn't a PATCH-settable target - promoting a Draft needs the approve flow's
 * side effects, filament reservation in particular, so it can't be a plain drag). */
export function BatchKanbanCard({ brand, batch, draggable }: BatchKanbanCardProps): JSX.Element {
  const router = useRouter()
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: batch.id,
    disabled: !draggable,
  })
  const style = transform ? { transform: CSS.Translate.toString(transform) } : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => router.push(`/dashboard/${brand}/production/batches/${batch.id}`)}
      className={cn(
        'border-border bg-surface flex flex-col gap-2 rounded-md border p-3 shadow-xs transition-colors',
        draggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer',
        'hover:border-border-strong',
        isDragging && 'z-10 opacity-60',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-sm font-medium">{batch.batchNumber}</span>
        {batch.materialShortage ? (
          <span title="Filament shortage" className="text-warning">
            <AlertTriangle className="size-3.5" aria-hidden />
          </span>
        ) : null}
      </div>
      <p className="text-muted-foreground text-xs">
        {batch.jobsCount ?? 0} jobs
        {batch.totalPrintTimeMinutes !== null
          ? ` · ${countdown(batch.totalPrintTimeMinutes * 60)}`
          : ''}
        {batch.totalFilamentGrams !== null ? ` · ${Math.round(batch.totalFilamentGrams)} g` : ''}
      </p>
      <p className="text-subtle-foreground text-xs">Created {batch.createdAt}</p>
    </div>
  )
}
