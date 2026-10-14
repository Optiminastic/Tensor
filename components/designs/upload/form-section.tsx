import type { JSX, ReactNode } from 'react'

interface FormSectionProps {
  /** Mono label, e.g. "01 · Files". */
  label: string
  description?: string
  children: ReactNode
}

/** One group of the upload form, under a mono label and a hairline. */
export function FormSection({ label, description, children }: FormSectionProps): JSX.Element {
  return (
    <fieldset className="border-border flex flex-col gap-4 border-t pt-5">
      <legend className="sr-only">{label}</legend>
      <div className="flex flex-col gap-1">
        <p
          aria-hidden
          className="text-muted-foreground font-mono text-xs tracking-[0.18em] uppercase"
        >
          {label}
        </p>
        {description ? <p className="text-muted-foreground text-sm">{description}</p> : null}
      </div>
      {children}
    </fieldset>
  )
}
