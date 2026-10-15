import { RotateCcw, TriangleAlert } from 'lucide-react'
import type { JSX } from 'react'

import { PillButton } from '@/components/landing/pill-button'
import { Button } from '@/components/ui/button'

import { GuideSection } from './guide-section'

/** The dashboard's buttons, the colour-coded row actions and the landing pills. */
export function ButtonsSection(): JSX.Element {
  return (
    <GuideSection
      title="Buttons"
      caption="One lime action per screen; outlines for the rest. A row of actions is colour-coded by what each does, and the label always says it too."
    >
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Save changes</Button>
          <Button variant="secondary">Cancel</Button>
          <Button variant="ghost">Skip for now</Button>
          <Button variant="danger">Delete</Button>
          <Button variant="link">View report</Button>
          <Button disabled>Disabled</Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="soft-muted" size="sm">
            Skip
          </Button>
          <Button variant="soft-danger" size="sm">
            <TriangleAlert aria-hidden />
            Issue
          </Button>
          <Button variant="soft-warning" size="sm">
            <RotateCcw aria-hidden />
            Reprint
          </Button>
          <Button variant="soft-success" size="sm">
            Record assembly
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <PillButton tone="lime" withArrow>
            Get started
          </PillButton>
          <PillButton tone="solid">Send back</PillButton>
          <PillButton tone="outline">Model</PillButton>
        </div>
      </div>
    </GuideSection>
  )
}
