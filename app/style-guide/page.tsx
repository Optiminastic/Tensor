import type { Metadata } from 'next'

import { StyleGuide } from '@/components/style-guide/style-guide'

export const metadata: Metadata = {
  title: 'Design language',
}

export default function StyleGuidePage(): JSX.Element {
  return <StyleGuide />
}
