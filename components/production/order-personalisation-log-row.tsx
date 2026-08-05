import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import Link from 'next/link'
import type { JSX } from 'react'

import { PERSONALISATION_STATUS_CONFIG } from '@/components/production/status-config'
import { TonePill } from '@/components/production/tone-pill'
import type { OrderJobPersonalisation } from '@/components/production/types'

interface OrderPersonalisationLogRowProps {
  brand: string
  job: OrderJobPersonalisation
}

/** One job's row in the order detail page's personalisation log. */
export function OrderPersonalisationLogRow({
  brand,
  job,
}: OrderPersonalisationLogRowProps): JSX.Element {
  const status = PERSONALISATION_STATUS_CONFIG[job.personalisation]

  return (
    <div className="border-border flex flex-col gap-1.5 border-b pb-4 last:border-b-0 last:pb-0">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          href={`/dashboard/${brand}/production/jobs/${job.jobId}`}
          className="text-foreground hover:text-accent text-sm font-medium"
        >
          {job.description}
        </Link>
        <TonePill label={status.label} tone={status.tone} />
      </div>
      {job.personalisation === 'not_required' ? null : job.log.length === 0 ? (
        <p className="text-success flex items-center gap-1.5 text-xs">
          <CheckCircle2 className="size-3.5" aria-hidden />
          Ready for batching
        </p>
      ) : (
        <ul className="flex flex-col gap-1">
          {job.log.map(reason => (
            <li key={reason} className="text-warning flex items-center gap-1.5 text-xs">
              <AlertTriangle className="size-3 shrink-0" aria-hidden />
              {reason}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
