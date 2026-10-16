import type { JSX } from 'react'

import { cn } from '@/lib/utils'
import type { DamageReport } from '@/lib/validators/whatsapp-damage'

interface DamagePhotoStateProps {
  report: Pick<DamageReport, 'photo_count' | 'photos_stored' | 'photos_pending' | 'photos_failed'>
}

/**
 * Whether we actually have the customer's photographs.
 *
 * NOT A COUNT. "Three photos" is what the customer sent; what decides whether
 * anybody can work the report is how many of them reached Tensor, and those
 * are different numbers. A report showing "3" that holds none of them sends
 * somebody to the queue expecting evidence that is not there.
 *
 * The four states are deliberately distinct, because the action each calls for
 * is different: all here, nothing to do; some still arriving, wait; some gone
 * for good, ask the customer again; none at all, the download never ran.
 */
export function DamagePhotoState({ report }: DamagePhotoStateProps): JSX.Element {
  const { photo_count: sent, photos_stored: stored, photos_pending: pending } = report
  const failed = report.photos_failed

  if (sent === 0) {
    return <span className="text-muted-foreground text-xs">No photos sent</span>
  }

  const parts: string[] = [`${stored} of ${sent} received`]
  if (pending > 0) parts.push('downloading')
  if (failed > 0) parts.push(`${failed} unavailable`)

  // Tone follows the worst thing true of the row, so a report missing a
  // photograph cannot read as complete.
  const tone =
    failed > 0
      ? 'text-danger'
      : pending > 0
        ? 'text-muted-foreground'
        : stored === sent
          ? 'text-success'
          : 'text-warning'

  return <span className={cn('font-mono text-xs tabular-nums', tone)}>{parts.join(' · ')}</span>
}
