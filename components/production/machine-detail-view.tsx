import type { JSX } from 'react'

import { MachinePhotoCard } from '@/components/production/machine-photo-card'
import { MachineSpecsGrid } from '@/components/production/machine-specs-grid'
import { MachineStatusPanel } from '@/components/production/machine-status-panel'
import type { MachineDetail } from '@/components/production/types'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'

interface MachineDetailViewProps {
  brand: string
  machine: MachineDetail
}

export function MachineDetailView({ brand, machine }: MachineDetailViewProps): JSX.Element {
  return (
    <div className="grid gap-6 md:grid-cols-[320px_1fr]">
      <MachinePhotoCard src={machine.imageSrc} alt={`${machine.name} printer`} />
      <Card>
        <MachineStatusPanel brand={brand} machine={machine} />
        <Separator />
        <MachineSpecsGrid machine={machine} />
      </Card>
    </div>
  )
}
