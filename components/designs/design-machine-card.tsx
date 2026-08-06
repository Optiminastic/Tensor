import { Cpu } from 'lucide-react'
import type { JSX } from 'react'

import { Card, CardContent } from '@/components/ui/card'
import type { Machine } from '@/lib/validators/machines'

interface DesignMachineCardProps {
  machine: Machine | null
}

/** The machine profile this design slices on, shown on the Overview tab. A null
 * machine means the design uses the built-in default profile. */
export function DesignMachineCard({ machine }: DesignMachineCardProps): JSX.Element {
  return (
    <Card>
      <CardContent>
        <div className="flex items-center gap-2">
          <Cpu className="text-muted-foreground size-4" aria-hidden />
          <p className="text-foreground text-sm font-medium">Machine profile</p>
        </div>
        {machine ? (
          <>
            <p className="text-foreground mt-2 text-sm font-medium">{machine.name}</p>
            <p className="text-muted-foreground mt-0.5 font-mono text-xs tabular-nums">
              {machine.family} / {machine.nozzle_mm.toFixed(1)}mm / {machine.flow} /{' '}
              {machine.layer_height_min_mm.toFixed(2)}-{machine.layer_height_max_mm.toFixed(2)}mm /{' '}
              {machine.supported_filaments.length} filaments
            </p>
            {machine.default_colour ? (
              <p className="text-subtle-foreground mt-0.5 text-xs">
                Default colour: {machine.default_colour}
              </p>
            ) : null}
          </>
        ) : (
          <>
            <p className="text-foreground mt-2 text-sm font-medium">Default profile</p>
            <p className="text-muted-foreground mt-0.5 text-xs">
              No machine selected - this design slices on the built-in Bambu H2S 0.4 nozzle profile.
            </p>
          </>
        )}
      </CardContent>
    </Card>
  )
}
