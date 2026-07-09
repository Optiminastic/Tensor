import type { ReactNode } from 'react'

import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

export interface FieldProps {
  label: string
  htmlFor?: string
  hint?: string
  error?: string
  required?: boolean
  className?: string
  children: ReactNode
}

/**
 * Label + control + hint/error, in the standard Tensor form rhythm.
 * Keeps forms visually consistent without prop-drilling layout.
 */
export function Field({
  label,
  htmlFor,
  hint,
  error,
  required,
  className,
  children,
}: FieldProps): JSX.Element {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label htmlFor={htmlFor}>
        {label}
        {required ? <span className="text-danger ml-0.5">*</span> : null}
      </Label>
      {children}
      {error ? (
        <p className="text-danger text-xs">{error}</p>
      ) : hint ? (
        <p className="text-muted-foreground text-xs">{hint}</p>
      ) : null}
    </div>
  )
}
