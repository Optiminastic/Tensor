import type { JSX } from 'react'

import { Card, CardContent } from '@/components/ui/card'

interface PickABrandNoticeProps {
  // The section name shown as the page title, e.g. "Integrations".
  section: string
  // A one-line explanation of why this section is per-brand.
  reason: string
}

/**
 * Shown in the global "All brands" view for sections that act on a single brand's
 * store, connections or config, where an aggregate view has no clear meaning.
 * Prompts the user to pick a brand from the switcher.
 */
export function PickABrandNotice({ section, reason }: PickABrandNoticeProps): JSX.Element {
  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10">
      <h1 className="text-display text-3xl">{section}</h1>
      <Card>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            {reason} Pick a brand from the switcher to continue.
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
