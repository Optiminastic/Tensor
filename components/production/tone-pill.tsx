import type { JSX } from 'react'

import type { PillTone } from '@/components/ui/pill-shape'
import { Tag } from '@/components/ui/tag'

export type { PillTone }

interface TonePillProps {
  label: string
  tone: PillTone
  className?: string
}

/** A status tag with its tone's icon (components/ui/tag.tsx). */
export function TonePill({ label, tone, className }: TonePillProps): JSX.Element {
  return (
    <Tag tone={tone} className={className}>
      {label}
    </Tag>
  )
}
