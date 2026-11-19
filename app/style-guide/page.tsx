import type { Metadata } from 'next'
import type { JSX } from 'react'

import { SubpageShell } from '@/components/landing/subpage-shell'
import { StyleGuide } from '@/components/style-guide/style-guide'

export const metadata: Metadata = {
  title: 'Design language',
}

export default function StyleGuidePage(): JSX.Element {
  return (
    <SubpageShell
      eyebrow="Design system"
      title="The design language behind Tensor"
      intro="The colours, type, controls and data displays every screen in the workspace is built from - one set of tokens, in light and dark."
    >
      <StyleGuide />
    </SubpageShell>
  )
}
