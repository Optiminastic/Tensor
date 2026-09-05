'use client'

import { useMemo, useState, type JSX } from 'react'

import { BatchTableGrid } from '@/components/production/batch-table-grid'
import { FleetMachineTable } from '@/components/production/fleet-machine-table'
import { PrintQueueBoard } from '@/components/production/print-queue-board'
import type { BatchRecord } from '@/components/production/types'
import { Tabs, type TabItem } from '@/components/ui/tabs'
import type { FleetMachine } from '@/lib/validators/machine-fleet'
import type { QueueItem } from '@/lib/validators/print-queue'

/**
 * Machine Management, split the way the work actually splits: what is waiting
 * to print, what is printing it, and what came off the bed.
 *
 * One page showed only the fleet, so a bed that had been locked and sent was
 * invisible until a printer picked it up, and a finished bed disappeared
 * entirely. Those are the two moments an operator most needs to look at - the
 * queue they are waiting on, and the plate they are about to inspect.
 *
 * Queued is BambuBuddy's own queue, read live, because that is the queue the
 * printers actually work from - a plate that has been sent is BambuBuddy's to
 * order and cancel, and mirroring it into Tensor would show a board that was
 * wrong the moment anyone touched the other system. Tensor's own locked batches
 * sit alongside it: they are committed but not yet handed over.
 *
 * History is by batch status - what is done. Drafts belong to Batch Management,
 * where they are built, and deliberately do not appear here.
 */
interface MachineManagementTabsProps {
  brand: string
  machines: FleetMachine[]
  batches: BatchRecord[]
  /** BambuBuddy's live queue. Empty when it could not be reached - see queueError. */
  queue: QueueItem[]
  queueError: string | null
}

const QUEUED = 'queued'
const MACHINES = 'machines'
const HISTORY = 'history'

export function MachineManagementTabs({
  brand,
  machines,
  batches,
  queue,
  queueError,
}: MachineManagementTabsProps): JSX.Element {
  // Machines first: it is the page people arrive for, and it was the whole
  // page until now - opening somewhere else would move the ground under them.
  const [tab, setTab] = useState(MACHINES)

  const { queued, history } = useMemo(
    () => ({
      // Locked and printing both count as queued: from an operator's point of
      // view a bed that has been sent is committed, whether or not a printer
      // has started pulling it yet.
      queued: batches.filter(b => b.status === 'open' || b.status === 'in_progress'),
      history: batches.filter(b => b.status === 'completed'),
    }),
    [batches],
  )

  // Only work that has yet to run. BambuBuddy keeps finished and cancelled
  // items in the same list, and a queue that counts them is not a queue.
  const liveQueue = useMemo(
    () => queue.filter(q => q.status === 'pending' || q.status === 'printing'),
    [queue],
  )

  const tabs: TabItem[] = [
    { value: QUEUED, label: 'Queued', count: liveQueue.length + queued.length },
    { value: MACHINES, label: 'Machines', count: machines.length },
    { value: HISTORY, label: 'History', count: history.length },
  ]

  return (
    <div className="flex flex-col gap-4">
      <Tabs tabs={tabs} value={tab} onValueChange={setTab} label="Machine management view" />

      {tab === QUEUED ? (
        <div role="tabpanel" aria-labelledby={`tab-${QUEUED}`}>
          {queued.length === 0 ? (
            <Empty>
              Nothing is queued. Lock a batch in Batch Management to send it to a printer.
            </Empty>
          ) : (
            <BatchTableGrid brand={brand} batches={queued} />
          )}
        </div>
      ) : null}

      {tab === MACHINES ? (
        <div role="tabpanel" aria-labelledby={`tab-${MACHINES}`}>
          <FleetMachineTable brand={brand} initialMachines={machines} />
        </div>
      ) : null}

      {tab === HISTORY ? (
        <div role="tabpanel" aria-labelledby={`tab-${HISTORY}`}>
          {history.length === 0 ? (
            <Empty>No completed batches yet.</Empty>
          ) : (
            <BatchTableGrid brand={brand} batches={history} />
          )}
        </div>
      ) : null}
    </div>
  )
}

function Empty({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <p className="text-muted-foreground rounded-md border border-dashed px-4 py-8 text-center text-sm">
      {children}
    </p>
  )
}
