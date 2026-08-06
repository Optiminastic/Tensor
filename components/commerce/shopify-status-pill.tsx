import type { JSX } from 'react'

import { type PillTone, TonePill } from '@/components/production/tone-pill'

const STATUS_TONE: Record<string, PillTone> = {
  ACTIVE: 'success',
  DRAFT: 'muted',
  ARCHIVED: 'danger',
}

interface ShopifyStatusPillProps {
  status: string
}

export function ShopifyStatusPill({ status }: ShopifyStatusPillProps): JSX.Element {
  const tone = STATUS_TONE[status] ?? 'muted'
  return <TonePill label={status} tone={tone} />
}
