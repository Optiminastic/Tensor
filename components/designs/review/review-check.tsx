import { Check, X } from 'lucide-react'
import type { JSX } from 'react'

import { cn } from '@/lib/utils'

interface ReviewCheckProps {
  passed: boolean
  label: string
}

/** One pass/fail check. The icon and the word carry it; colour only echoes. */
export function ReviewCheck({ passed, label }: ReviewCheckProps): JSX.Element {
  const Icon = passed ? Check : X
  return (
    <span className="inline-flex items-center gap-1.5 text-sm">
      <span
        aria-hidden
        className={cn(
          'grid size-5 place-items-center rounded-full',
          passed ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger',
        )}
      >
        <Icon className="size-3" strokeWidth={3} />
      </span>
      <span>
        <span className="sr-only">{passed ? 'Passes: ' : 'Fails: '}</span>
        {label}
      </span>
    </span>
  )
}
