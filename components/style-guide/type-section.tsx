import type { JSX } from 'react'

import { DataValue } from '@/components/ui/data-value'

import { GuideSection } from './guide-section'

/** The two faces and what each is for. */
export function TypeSection(): JSX.Element {
  return (
    <GuideSection
      title="Type"
      caption="Inter Tight sets the interface and the titles; Geist Mono sets every figure and the small labels."
    >
      <div className="bg-surface ring-border flex flex-col gap-6 rounded-3xl p-6 ring-1">
        <div className="flex flex-col gap-2">
          <p className="text-4xl font-medium tracking-[-0.04em] sm:text-5xl">
            Every print accounted for
          </p>
          <p className="text-muted-foreground font-mono text-xs">
            Inter Tight · medium · tracked tight · titles
          </p>
        </div>
        <div className="border-border flex flex-col gap-2 border-t pt-5">
          <p className="max-w-prose text-sm">
            The interface stays quiet so the numbers lead: labels, controls and paragraphs are Inter
            Tight at reading sizes, and de-emphasis comes from size and weight, never from a fainter
            grey.
          </p>
          <p className="text-muted-foreground font-mono text-xs">Inter Tight · body and controls</p>
        </div>
        <div className="border-border flex flex-col gap-3 border-t pt-5">
          <div className="flex flex-wrap items-baseline gap-6">
            <DataValue value="₹240" className="text-xl" />
            <DataValue value="2h 14m" className="text-xl" />
            <DataValue value="62" unit="g" className="text-xl" />
            <DataValue value="25.0" unit="%" className="text-xl" />
          </div>
          <p className="text-muted-foreground font-mono text-xs">
            Geist Mono · tabular, so columns of figures align
          </p>
        </div>
      </div>
    </GuideSection>
  )
}
