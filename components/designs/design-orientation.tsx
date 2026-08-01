import { Check, RotateCcw } from 'lucide-react'
import type { JSX } from 'react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Stat } from '@/components/ui/stat'
import type { Orientation } from '@/lib/validators/designs'

interface DesignOrientationProps {
  orientation: Orientation
}

function pct(fraction: number): string {
  return `${Math.round(fraction * 100)}%`
}

/**
 * The least-support resting orientation computed from the model mesh. Advisory
 * guidance for whoever positions the print; it never changes the costed price.
 */
export function DesignOrientation({ orientation }: DesignOrientationProps): JSX.Element {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recommended orientation</CardTitle>
      </CardHeader>
      {orientation.already_optimal ? (
        <CardContent>
          <p className="text-muted-foreground flex items-start gap-2 text-sm">
            <Check className="text-success mt-0.5 size-4 shrink-0" aria-hidden />
            This model is already well-oriented for minimal support. No rotation needed.
          </p>
        </CardContent>
      ) : (
        <CardContent className="flex flex-col gap-4">
          <p className="text-foreground flex items-start gap-2 text-sm">
            <RotateCcw className="text-accent mt-0.5 size-4 shrink-0" aria-hidden />
            {orientation.description}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Stat
              label="Est. less overhang"
              value={pct(orientation.est_reduction_pct)}
              hint="vs the uploaded orientation"
            />
            <Stat
              label="Rotation"
              value={`${orientation.rotation_degrees.toFixed(0)}°`}
              hint="about a single axis"
            />
          </div>
          <p className="text-subtle-foreground text-xs">
            Advisory only - guidance for positioning the print. It does not change the costed price.
          </p>
        </CardContent>
      )}
    </Card>
  )
}
