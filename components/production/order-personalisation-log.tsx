import type { JSX } from 'react'

import { OrderPersonalisationLogRow } from '@/components/production/order-personalisation-log-row'
import type { OrderJobPersonalisation } from '@/components/production/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface OrderPersonalisationLogProps {
  brand: string
  jobs: OrderJobPersonalisation[]
}

/** Per-job personalisation state for every job created from this order - what's
 * ready to batch and what's still pending, and why. Empty when no production
 * jobs exist yet for the order (before Stage 2 has run, or for a personalised
 * item still awaiting manual creation). */
export function OrderPersonalisationLog({
  brand,
  jobs,
}: OrderPersonalisationLogProps): JSX.Element | null {
  if (jobs.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Personalisation log</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {jobs.map(job => (
          <OrderPersonalisationLogRow key={job.jobId} brand={brand} job={job} />
        ))}
      </CardContent>
    </Card>
  )
}
