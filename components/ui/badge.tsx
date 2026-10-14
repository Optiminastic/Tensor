import { cva, type VariantProps } from 'class-variance-authority'
import type { HTMLAttributes, JSX } from 'react'

import { pillClasses } from '@/components/ui/pill-shape'
import { cn } from '@/lib/utils'

// Every tone but outline is a status tag in the shared shape
// (components/ui/pill-shape.ts). Outline stays a quiet bordered label, for
// facts that are not a status - which brand a design belongs to.
const badgeVariants = cva('', {
  variants: {
    tone: {
      neutral: pillClasses('muted'),
      accent: pillClasses('accent'),
      success: pillClasses('success'),
      warning: pillClasses('warning'),
      danger: pillClasses('danger'),
      outline:
        'border-border text-muted-foreground inline-flex items-center gap-1 rounded-lg border px-2.5 py-1 text-xs font-medium whitespace-nowrap',
    },
  },
  defaultVariants: {
    tone: 'neutral',
  },
})

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, tone, ...props }: BadgeProps): JSX.Element {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />
}

export { badgeVariants }
