import type { JSX } from 'react'

import { cn } from '@/lib/utils'
import type { DamageReport } from '@/lib/validators/whatsapp-damage'

interface DamagePhotoStateProps {
  report: Pick<DamageReport, 'file_count'>
}

/**
 * How much the customer sent to look at.
 *
 * ONE NUMBER NOW. This used to read "2 of 3 received · 1 unavailable",
 * because the photographs came in as WhatsApp attachments that Tensor had to
 * fetch back out of Meta and could still be chasing, or have given up on. The
 * form uploads them here directly, so a file the report has is simply there
 * and the only thing left to say is how many.
 *
 * A report with none is still called out: it should not happen - the form
 * refuses an empty submission - so when it does, somebody should see it
 * rather than read a quiet dash.
 */
export function DamagePhotoState({ report }: DamagePhotoStateProps): JSX.Element {
  const count = report.file_count
  if (count === 0) {
    return <span className="text-warning text-xs">Nothing attached</span>
  }
  return (
    <span className={cn('font-mono text-xs tabular-nums', 'text-muted-foreground')}>
      {count} {count === 1 ? 'file' : 'files'}
    </span>
  )
}
