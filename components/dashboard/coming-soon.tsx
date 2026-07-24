import { Hammer } from 'lucide-react'
import type { JSX } from 'react'

interface ComingSoonProps {
  title: string
  description?: string
}

/**
 * Placeholder for a workflow area that is planned but not built yet, so every
 * sidebar destination resolves to a titled screen rather than a 404.
 */
export function ComingSoon({ title, description }: ComingSoonProps): JSX.Element {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="bg-surface-muted text-subtle-foreground flex size-12 items-center justify-center rounded-full">
        <Hammer className="size-6" aria-hidden />
      </span>
      <h1 className="text-display text-3xl">{title}</h1>
      {description ? (
        <p className="text-muted-foreground max-w-md text-sm text-pretty">{description}</p>
      ) : null}
      <span className="bg-accent-subtle text-accent rounded-full px-3 py-1 text-xs font-medium">
        Coming soon
      </span>
    </main>
  )
}
