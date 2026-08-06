import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import type { JSX } from 'react'

import { PersonalisationCheckDialog } from '@/components/production/personalisation-check-dialog'
import { PERSONALISATION_STATUS_CONFIG } from '@/components/production/status-config'
import { TonePill } from '@/components/production/tone-pill'
import type { ProductionJobDetail } from '@/components/production/types'

interface PersonalisationLogProps {
  brand: string
  job: ProductionJobDetail
}

/** What's ready and what's pending for this job's personalisation, and why -
 * the reasons come straight from the backend's PersonalisationLog (lifecycle.go),
 * so the wording here always matches what actually blocks batching. */
export function PersonalisationLog({ brand, job }: PersonalisationLogProps): JSX.Element {
  const status = PERSONALISATION_STATUS_CONFIG[job.personalisation]
  const notRequired = job.personalisation === 'not_required'

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <TonePill label={status.label} tone={status.tone} />
        {notRequired ? null : <PersonalisationCheckDialog brand={brand} job={job} />}
      </div>

      {notRequired ? (
        <p className="text-muted-foreground text-sm">
          This job has no customer personalisation to confirm.
        </p>
      ) : job.personalisationLog.length === 0 ? (
        <p className="text-success flex items-center gap-1.5 text-sm">
          <CheckCircle2 className="size-4" aria-hidden />
          Every field is confirmed. Ready for batching.
        </p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {job.personalisationLog.map(reason => (
            <li key={reason} className="text-warning flex items-center gap-1.5 text-sm">
              <AlertTriangle className="size-3.5 shrink-0" aria-hidden />
              {reason}
            </li>
          ))}
        </ul>
      )}

      {job.personalisationNote ? (
        <p className="text-muted-foreground text-sm">
          <span className="text-foreground font-medium">Notes: </span>
          {job.personalisationNote}
        </p>
      ) : null}
    </div>
  )
}
