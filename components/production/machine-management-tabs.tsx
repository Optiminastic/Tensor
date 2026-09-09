'use client'

import { useMemo, useState, type JSX } from 'react'

import { BatchTableGrid } from '@/components/production/batch-table-grid'
import { FleetMachineTable } from '@/components/production/fleet-machine-table'
import { PrintHistoryBoard } from '@/components/production/print-history-board'
import { PrintQueueBoard } from '@/components/production/print-queue-board'
import type { BatchRecord } from '@/components/production/types'
import { Tabs, type TabItem } from '@/components/ui/tabs'
import type { FleetMachine } from '@/lib/validators/machine-fleet'
import type { Archive } from '@/lib/validators/print-history'
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
  /** BambuBuddy's print history. Empty when it could not be reached - see historyError. */
  history: Archive[]
  historyError: string | null
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
  history,
  historyError,
}: MachineManagementTabsProps): JSX.Element {
  // Machines first: it is the page people arrive for, and it was the whole
  // page until now - opening somewhere else would move the ground under them.
  const [tab, setTab] = useState(MACHINES)

  // Locked and printing both count as queued: from an operator's point of view
  // a bed that has been sent is committed, whether or not a printer has started
  // pulling it yet.
  //
  // Batches no longer back History. A Tensor batch records what was SENT; only
  // BambuBuddy watched what happened, so a bed that FAILED on the printer never
  // reached a history built from batch statuses - which is the one row an
  // operator most needs to see.
  const queued = useMemo(
    () => batches.filter(b => b.status === 'open' || b.status === 'in_progress'),
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
        <div role="tabpanel" aria-labelledby={`tab-${QUEUED}`} className="flex flex-col gap-6">
          {/* Two lists, in the order work moves through them. BambuBuddy's is
              first because it is the one the printers actually pull from; the
              board was built and imported but never rendered, so this tab
              showed only Tensor's side of the handover. */}
          <section className="flex flex-col gap-2">
            <h2 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              In BambuBuddy&rsquo;s queue
            </h2>
            <PrintQueueBoard items={liveQueue} error={queueError} />
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
              Locked in Tensor, not yet handed over
            </h2>
            {queued.length === 0 ? (
              <Empty>
                Nothing is waiting. Lock a batch in Batch Management to send it to a printer.
              </Empty>
            ) : (
              <BatchTableGrid brand={brand} batches={queued} />
            )}
          </section>
        </div>
      ) : null}

      {tab === MACHINES ? (
        <div role="tabpanel" aria-labelledby={`tab-${MACHINES}`}>
          <FleetMachineTable brand={brand} initialMachines={machines} />
        </div>
      ) : null}

      {tab === HISTORY ? (
        <div role="tabpanel" aria-labelledby={`tab-${HISTORY}`}>
          <PrintHistoryBoard items={history} error={historyError} />
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
