'use client'

import { useState, type JSX } from 'react'

import { AssemblyQueueTable } from '@/components/production/assembly-queue-table'
import type { BatchNumbers } from '@/components/production/batch-label'
import { DispatchQueueTable } from '@/components/production/dispatch-queue-table'
import { PackagingQueueTable } from '@/components/production/packaging-queue-table'
import { QcQueueTable } from '@/components/production/qc-queue-table'
import type { DispatchReadyOrder } from '@/components/production/types'
import { Tabs, type TabItem } from '@/components/ui/tabs'
import type { DispatchOrder } from '@/lib/validators/dispatch'
import type { ProductionJob } from '@/lib/validators/production'

type TabValue = 'assembly' | 'qc' | 'packaging' | 'dispatch'

export interface DispatchPanelData {
  dispatches: DispatchOrder[]
  readyOrders: DispatchReadyOrder[]
  orderNumbers: Record<string, string>
  // Set when the dispatch/order lookups failed on their own (e.g. a role
  // without dispatch:read) - the other three stations still render.
  error: string | null
}

interface PackagingStationTabsProps {
  brand: string
  queues: {
    assembly: ProductionJob[]
    qc: ProductionJob[]
    packaging: ProductionJob[]
  }
  // Which bed each job was printed on, for the three station queues' Batch
  // column. Empty when the batch list wasn't readable - the column then falls
  // back to a short batch id.
  batchNumbers: BatchNumbers
  dispatch: DispatchPanelData
}

/** The four post-print stations in pipeline order - Assembly -> Quality Check
 * -> Packaging -> Dispatch - switched by one tab bar. Each panel is the queue
 * of work waiting at that station. */
export function PackagingStationTabs({
  brand,
  queues,
  batchNumbers,
  dispatch,
}: PackagingStationTabsProps): JSX.Element {
  const [tab, setTab] = useState<TabValue>('assembly')
  const tabs: TabItem[] = [
    { value: 'assembly', label: 'Assembly', count: queues.assembly.length },
    { value: 'qc', label: 'Quality Check', count: queues.qc.length },
    { value: 'packaging', label: 'Packaging', count: queues.packaging.length },
    { value: 'dispatch', label: 'Dispatch', count: dispatch.readyOrders.length },
  ]

  return (
    <div className="flex flex-col gap-5">
      <Tabs
        tabs={tabs}
        value={tab}
        onValueChange={value => setTab(value as TabValue)}
        label="Post-print station queues"
      />
      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === 'assembly' ? (
          <AssemblyQueueTable brand={brand} jobs={queues.assembly} batchNumbers={batchNumbers} />
        ) : null}
        {tab === 'qc' ? (
          <QcQueueTable brand={brand} jobs={queues.qc} batchNumbers={batchNumbers} />
        ) : null}
        {tab === 'packaging' ? (
          <PackagingQueueTable brand={brand} jobs={queues.packaging} batchNumbers={batchNumbers} />
        ) : null}
        {tab === 'dispatch' ? (
          dispatch.error ? (
            <p role="alert" className="bg-danger-subtle text-danger rounded-md px-3 py-2 text-sm">
              {dispatch.error}
            </p>
          ) : (
            <DispatchQueueTable
              brand={brand}
              dispatches={dispatch.dispatches}
              readyOrders={dispatch.readyOrders}
              orderNumbers={dispatch.orderNumbers}
            />
          )
        ) : null}
      </div>
    </div>
  )
}
