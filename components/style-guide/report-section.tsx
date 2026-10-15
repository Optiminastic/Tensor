import type { JSX } from 'react'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { DataValue } from '@/components/ui/data-value'
import { Stat } from '@/components/ui/stat'
import { StatusPill } from '@/components/ui/status-pill'
import { Tag } from '@/components/ui/tag'

import { GuideSection } from './guide-section'

/** A designer's pre-check, the product's core artefact, built from the parts above. */
export function ReportSection(): JSX.Element {
  return (
    <GuideSection
      title="In context"
      caption="A designer's pre-check report: the figures in mono, the verdict as a tag, the cost share as a bar."
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Design CP" value="₹240" hint="Target ≤ ₹250" />
        <Stat label="CP of SP" value="25.0%" hint="Within the 25% rule" />
        <Stat label="Machine / unit" value="1.38h" hint="4 units per bed" />
        <Stat label="Filament" value="62g" hint="+ 8g purge" />
      </div>
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div className="flex flex-col gap-1.5">
            <CardTitle>Aarav name lamp · v3</CardTitle>
            <CardDescription>Gifting · PLA · 3 colours · aarav-lamp.3mf</CardDescription>
          </div>
          <StatusPill status="green" />
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="text-muted-foreground flex items-center justify-between text-xs">
              <span>Design CP as a share of the ₹999 selling price</span>
              <DataValue value="25.0" unit="%" />
            </div>
            <div className="bg-surface-muted h-2 w-full overflow-hidden rounded-full">
              <div className="bg-success h-full w-1/4 rounded-full" />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Tag tone="success">Suitable for ₹999</Tag>
            <Tag tone="muted">Batch 4 / bed</Tag>
            <Tag tone="muted">Low support</Tag>
          </div>
        </CardContent>
      </Card>
    </GuideSection>
  )
}
