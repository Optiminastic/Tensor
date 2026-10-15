import type { JSX } from 'react'

import { Badge } from '@/components/ui/badge'
import { Tag } from '@/components/ui/tag'

import { GuideSection } from './guide-section'

/** Every status tag tone, with the words it carries in the product. */
export function TagsSection(): JSX.Element {
  return (
    <GuideSection
      title="Tags"
      caption="Pastel tiles with a hairline edge and an icon: done, waiting, stopped, under way, nothing yet. In dark mode they deepen to tints of the same hue."
    >
      <div className="flex flex-wrap items-center gap-2">
        <Tag tone="success">Completed</Tag>
        <Tag tone="warning">Pending</Tag>
        <Tag tone="danger">Failed</Tag>
        <Tag tone="accent">In progress</Tag>
        <Tag tone="muted">Queued</Tag>
        <Badge tone="outline">PLA</Badge>
      </div>
    </GuideSection>
  )
}
