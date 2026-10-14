import { Loader2 } from 'lucide-react'
import type { JSX } from 'react'

import { PILL_DOT, pillClasses, type PillTone } from '@/components/ui/pill-shape'
import { cn } from '@/lib/utils'
import type { DesignLifecycle } from '@/lib/validators/designs'

interface StatusConfig {
  label: string
  tone: PillTone
  spin?: boolean
}

// Lifecycle (queued -> slicing -> priced | failed) is distinct from the
// Green/Yellow/Red verdict, which only exists once a design is priced.
const CONFIG: Record<DesignLifecycle, StatusConfig> = {
  queued: { label: 'Queued', tone: 'muted' },
  slicing: { label: 'Slicing', tone: 'accent', spin: true },
  priced: { label: 'Priced', tone: 'accent' },
  failed: { label: 'Failed', tone: 'danger' },
  submitted: { label: 'In review', tone: 'warning' },
  changes_requested: { label: 'Changes requested', tone: 'danger' },
  approved: { label: 'Approved', tone: 'accent' },
  published: { label: 'Published', tone: 'success' },
  archived: { label: 'Archived', tone: 'muted' },
}

interface DesignStatusBadgeProps {
  status: DesignLifecycle
  className?: string
}

export function DesignStatusBadge({ status, className }: DesignStatusBadgeProps): JSX.Element {
  const config = CONFIG[status]
  return (
    <span className={pillClasses(config.tone, className)}>
      {config.spin ? (
        <Loader2 className="size-3 animate-spin" aria-hidden />
      ) : (
        <span className={cn('size-1.5 rounded-full', PILL_DOT[config.tone])} aria-hidden />
      )}
      {config.label}
    </span>
  )
}
