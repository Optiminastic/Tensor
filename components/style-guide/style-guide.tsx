import type { JSX } from 'react'

import { ButtonsSection } from './buttons-section'
import { ColourSection } from './colour-section'
import { LadderSection } from './ladder-section'
import { ReportSection } from './report-section'
import { TagsSection } from './tags-section'
import { TilesSection } from './tiles-section'
import { TypeSection } from './type-section'

/**
 * The design system as it is built: every token and component shown live, so
 * this page is always the truth - it renders the real primitives, not
 * pictures of them. The theme switch in the header shows both themes.
 */
export function StyleGuide(): JSX.Element {
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-16 px-4 py-16 sm:px-6 sm:py-20">
      <ColourSection />
      <TypeSection />
      <ButtonsSection />
      <TagsSection />
      <TilesSection />
      <ReportSection />
      <LadderSection />
    </div>
  )
}
