import type { Metadata } from 'next'
import type { JSX } from 'react'

import { MachineManagementTable } from '@/components/production/machine-management-table'
import { ProductionPageHeader } from '@/components/production/production-page-header'
import { MACHINE_RECORDS } from '@/components/production/sample-data'

export const metadata: Metadata = { title: 'Machine Management' }

interface MachineManagementPageProps {
  params: Promise<{ brand: string }>
}

export default async function MachineManagementPage({
  params,
}: MachineManagementPageProps): Promise<JSX.Element> {
  const { brand } = await params

  return (
    <main className="flex w-full flex-col gap-8 px-6 py-10 md:px-8">
      <ProductionPageHeader
        title="Machine Management"
        description="Add printers and keep their live status up to date."
      />
      <MachineManagementTable brand={brand} machines={MACHINE_RECORDS} />
    </main>
  )
}
