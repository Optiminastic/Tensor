'use client'

import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState, type JSX } from 'react'

import { approveBatchAction, patchBatchAction } from '@/app/dashboard/[brand]/production/actions'
import { BatchGroupedList } from '@/components/production/batch-grouped-list'
import { BatchKanbanColumn } from '@/components/production/batch-kanban-column'
import {
  DEFAULT_PERIOD,
  isWithinDateRange,
  type PeriodValue,
  resolvePeriod,
} from '@/components/production/date-range'
import { OverviewDateRange } from '@/components/production/overview-date-range'
import { BATCH_STATUS_CONFIG } from '@/components/production/status-config'
import type { BatchRecord, BatchStatus } from '@/components/production/types'
import { Input } from '@/components/ui/input'
import { Tabs, type TabItem } from '@/components/ui/tabs'

interface MachineQueueBoardProps {
  brand: string
  batches: BatchRecord[]
  /** Which period the board opens on. Defaults to the shared DEFAULT_PERIOD
   * (the current Mon-Sun week), which is right for the Overview but wrong for
   * a machine's own queue: that board is the only place Completed batches are
   * visible, and filtering by createdAt hides a batch the moment its week
   * rolls over even though it is still the machine's most recent work. Pass
   * `{ unit: 'all', anchor: '' }` there. */
  defaultPeriod?: PeriodValue
}

const COLUMNS: BatchStatus[] = ['pending_approval', 'open', 'in_progress', 'completed']
const VIEW_TABS: TabItem[] = [
  { value: 'board', label: 'Board' },
  { value: 'list', label: 'List' },
]

function FilterField({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}): JSX.Element {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-subtle-foreground text-[10px] font-medium tracking-wide uppercase">
        {label}
      </span>
      {children}
    </div>
  )
}

/** The queued-batches board: a drag-and-drop Kanban across the four batch
 * statuses (equal-width columns), with search/period filters and a Board/List
 * toggle above. Every card is draggable, including Draft's - dropping it
 * elsewhere goes through the real approve flow (filament reservation, machine
 * assignment) rather than a plain PATCH, then advances further if the drop
 * target was Printing/Completed. Optimistic locally, reverted if the backend
 * rejects it. Draft itself never accepts a drop - the backend has no way to
 * set a batch back to pending_approval. */
export function MachineQueueBoard({
  brand,
  batches,
  defaultPeriod = DEFAULT_PERIOD,
}: MachineQueueBoardProps): JSX.Element {
  const router = useRouter()
  const [localBatches, setLocalBatches] = useState(batches)
  const [search, setSearch] = useState('')
  const [period, setPeriod] = useState<PeriodValue>(defaultPeriod)
  const [view, setView] = useState<'board' | 'list'>('board')
  const [error, setError] = useState<string | null>(null)

  // A card is both draggable and clickable, and without an activation
  // constraint those two fight: dnd-kit's PointerSensor starts a drag on
  // pointerdown and preventDefault()s it, so the browser never emits the
  // click and opening a batch silently does nothing.
  //
  // 5px of movement separates them - a press that never moves stays a click,
  // anything further is a drag. KeyboardSensor is listed explicitly because
  // passing `sensors` at all replaces the defaults, and dropping it would
  // quietly remove keyboard dragging.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  )

  useEffect(() => setLocalBatches(batches), [batches])

  const periodRange = useMemo(() => resolvePeriod(period, new Date()), [period])

  const filtered = useMemo(
    () =>
      localBatches.filter(
        b =>
          isWithinDateRange(b.createdAt, periodRange) &&
          (!search || b.batchNumber.toLowerCase().includes(search.trim().toLowerCase())),
      ),
    [localBatches, periodRange, search],
  )

  const byStatus = useMemo(() => {
    const map = new Map<BatchStatus, BatchRecord[]>()
    for (const status of COLUMNS) map.set(status, [])
    for (const b of filtered) map.get(b.status)?.push(b)
    return map
  }, [filtered])

  // Shared by dragging a card (Board) and picking a status from a row's
  // Select (List) - both surfaces enforce the same rule set.
  async function changeStatus(batchId: string, newStatus: BatchStatus): Promise<void> {
    const batch = localBatches.find(b => b.id === batchId)
    if (!batch || batch.status === newStatus) return
    if (newStatus === 'pending_approval') {
      setError("Batches can't be moved back to Draft.")
      return
    }

    setError(null)
    const previous = localBatches
    setLocalBatches(bs => bs.map(b => (b.id === batchId ? { ...b, status: newStatus } : b)))

    // Promoting out of Draft has to go through the approve flow (filament
    // reservation, machine assignment) rather than a bare PATCH - which the
    // backend wouldn't accept anyway, pending_approval -> anything is only
    // ever done via /approve, never a plain status PATCH.
    if (batch.status === 'pending_approval') {
      const approveRes = await approveBatchAction(brand, batchId, {})
      if (!approveRes.ok) {
        setLocalBatches(previous)
        setError(approveRes.error ?? 'Could not approve the batch.')
        return
      }
      if (newStatus === 'open') {
        router.refresh()
        return
      }
    }

    const res = await patchBatchAction(brand, batchId, { status: newStatus })
    if (!res.ok) {
      setLocalBatches(previous)
      setError(res.error ?? 'Could not move the batch.')
      return
    }
    router.refresh()
  }

  async function handleDragEnd(event: DragEndEvent): Promise<void> {
    const { active, over } = event
    if (!over) return
    await changeStatus(String(active.id), over.id as BatchStatus)
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="flex shrink-0 flex-nowrap items-end gap-3 overflow-x-auto">
        <FilterField label="Search">
          <div className="relative w-56">
            <Search
              className="text-subtle-foreground pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2"
              aria-hidden
            />
            <Input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search batch #"
              aria-label="Search batches"
              className="pl-8"
            />
          </div>
        </FilterField>
        <FilterField label="Period">
          <OverviewDateRange value={period} onChange={setPeriod} />
        </FilterField>
        <div className="ml-auto">
          <FilterField label="View">
            <Tabs
              tabs={VIEW_TABS}
              value={view}
              onValueChange={v => setView(v as 'board' | 'list')}
              label="Board or list view"
            />
          </FilterField>
        </div>
      </div>

      {error ? (
        <p role="alert" className="text-danger shrink-0 text-sm">
          {error}
        </p>
      ) : null}

      {view === 'list' ? (
        // The list is one long column rather than four, so it scrolls as a
        // whole instead of per status.
        <div className="min-h-0 flex-1 overflow-y-auto">
          <BatchGroupedList
            brand={brand}
            batches={filtered}
            onStatusChange={(batchId, status) => void changeStatus(batchId, status)}
          />
        </div>
      ) : (
        <DndContext sensors={sensors} onDragEnd={event => void handleDragEnd(event)}>
          <div className="flex min-h-0 flex-1 gap-3">
            {COLUMNS.map(status => (
              <BatchKanbanColumn
                key={status}
                brand={brand}
                status={status}
                label={BATCH_STATUS_CONFIG[status].label}
                batches={byStatus.get(status) ?? []}
                droppable={status !== 'pending_approval'}
              />
            ))}
          </div>
        </DndContext>
      )}
    </div>
  )
}
