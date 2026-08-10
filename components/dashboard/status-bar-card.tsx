import type { JSX } from 'react'

import { StatusBreakdown } from '@/components/dashboard/status-breakdown'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { StatusSegment } from '@/lib/dashboard/overview'

interface StatusBarCardProps {
  title: string
  description: string
  segments: StatusSegment[]
  total: number
  unit: string
}

/**
 * A status card built on horizontal breakdown bars, with the total pulled out as a
 * headline figure beside the title.
 */
export function StatusBarCard({
  title,
  description,
  segments,
  total,
  unit,
}: StatusBarCardProps): JSX.Element {
  return (
    <Card className="flex flex-col">
      <CardHeader className="flex-row items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        <p className="text-foreground shrink-0 font-mono text-2xl font-medium tabular-nums">
          {total}
          <span className="text-subtle-foreground ml-1.5 text-xs font-normal tracking-wide uppercase">
            {unit}
          </span>
        </p>
      </CardHeader>
      <div className="flex-1 px-5 py-5">
        <StatusBreakdown segments={segments} total={total} />
      </div>
    </Card>
  )
}
