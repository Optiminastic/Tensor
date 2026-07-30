import { ArrowLeft } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { JSX } from 'react'

import { MachineDetailView } from '@/components/production/machine-detail-view'
import { getMachineDetail } from '@/components/production/sample-data'

export const metadata: Metadata = { title: 'Machine' }

interface MachinePageProps {
  params: Promise<{ brand: string; machineId: string }>
}

export default async function MachinePage({ params }: MachinePageProps): Promise<JSX.Element> {
  const { brand, machineId } = await params
  const machine = getMachineDetail(machineId)
  if (!machine) notFound()

  return (
    <main className="flex w-full flex-col gap-6 px-6 py-10 md:px-8">
      <div className="flex flex-col gap-3">
        <Link
          href={`/dashboard/${brand}/production?view=machines`}
          className="text-muted-foreground hover:text-foreground inline-flex w-fit items-center gap-1.5 text-sm"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Back to Machine Management
        </Link>
        <div className="flex flex-col gap-2">
          <h1 className="text-display text-3xl">{machine.name}</h1>
          <p className="text-muted-foreground text-sm">Printer detail and live status.</p>
        </div>
      </div>
      <MachineDetailView machine={machine} />
    </main>
  )
}
