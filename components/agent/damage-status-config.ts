import type { PillTone } from '@/components/production/tone-pill'
import type { DamageStatus } from '@/lib/validators/whatsapp-damage'

/**
 * Where a damage report has got to.
 *
 * Its own file rather than an entry in production/status-config.ts: that file
 * is at its five-hundred-line budget and every status in it belongs to the
 * production pipeline, which this does not.
 *
 * `new` is a warning rather than a neutral. A customer whose parcel arrived
 * broken is waiting on a reply, and a quiet grey pill is how a row like that
 * sits unread for a week.
 */
export const DAMAGE_STATUS_CONFIG: Record<DamageStatus, { label: string; tone: PillTone }> = {
  new: { label: 'New', tone: 'warning' },
  in_review: { label: 'In review', tone: 'accent' },
  resolved: { label: 'Resolved', tone: 'success' },
}
