'use client'

import { useState, type JSX } from 'react'

import { PackagingQueueTable } from '@/components/production/packaging-queue-table'
import { QcQueueTable } from '@/components/production/qc-queue-table'
import { Tabs, type TabItem } from '@/components/ui/tabs'
import type { ProductionJob } from '@/lib/validators/production'

type TabValue = 'qc' | 'packaging'

interface QcPackagingTabsProps {
  brand: string
  qcJobs: ProductionJob[]
  packagingJobs: ProductionJob[]
}

/** The QC/Packaging page's two queues, switched by a tab bar: jobs waiting on
 * a QC decision, and jobs that passed QC and are waiting to be packed. */
export function QcPackagingTabs({
  brand,
  qcJobs,
  packagingJobs,
}: QcPackagingTabsProps): JSX.Element {
  const [tab, setTab] = useState<TabValue>('qc')
  const tabs: TabItem[] = [
    { value: 'qc', label: 'Pending QC', count: qcJobs.length },
    { value: 'packaging', label: 'Pending Packaging', count: packagingJobs.length },
  ]

  return (
    <div className="flex flex-col gap-5">
      <Tabs
        tabs={tabs}
        value={tab}
        onValueChange={value => setTab(value as TabValue)}
        label="QC and packaging queues"
      />
      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`}>
        {tab === 'qc' ? (
          <QcQueueTable brand={brand} jobs={qcJobs} />
        ) : (
          <PackagingQueueTable brand={brand} jobs={packagingJobs} />
        )}
      </div>
    </div>
  )
}
