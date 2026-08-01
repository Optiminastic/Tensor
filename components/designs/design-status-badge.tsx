import { Loader2 } from 'lucide-react'
import type { JSX } from 'react'

import { cn } from '@/lib/utils'
import type { DesignLifecycle } from '@/lib/validators/designs'

interface StatusConfig {
  label: string
  className: string
  spin?: boolean
}

// Lifecycle (queued -> slicing -> priced | failed) is distinct from the
// Green/Yellow/Red verdict, which only exists once a design is priced.
const CONFIG: Record<DesignLifecycle, StatusConfig> = {
  queued: { label: 'Queued', className: 'bg-surface-muted text-muted-foreground' },
  slicing: { label: 'Slicing', className: 'bg-accent-subtle text-accent', spin: true },
  priced: { label: 'Priced', className: 'bg-accent-subtle text-accent' },
  failed: { label: 'Failed', className: 'bg-danger-subtle text-danger' },
  approved: { label: 'Approved', className: 'bg-accent-subtle text-accent' },
  published: { label: 'Published', className: 'bg-success-subtle text-success' },
}

interface DesignStatusBadgeProps {
  status: DesignLifecycle
  className?: string
}

export function DesignStatusBadge({ status, className }: DesignStatusBadgeProps): JSX.Element {
  const config = CONFIG[status]
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold tracking-wide uppercase',
        config.className,
        className,
      )}
    >
      {config.spin ? <Loader2 className="size-3 animate-spin" aria-hidden /> : null}
      {config.label}
    </span>
  )
}
