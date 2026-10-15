import type { JSX, ReactNode } from 'react'

import { PageHeading } from '@/components/dashboard/page-heading'

interface ProductionPageHeaderProps {
  title: string
  /** Left out where the page speaks for itself; no empty line is drawn. */
  description?: ReactNode
  /** The mono label above the title: the area this page belongs to. */
  eyebrow?: string
  actions?: ReactNode
}

/** A production, agent or shipping page's heading: PageHeading, eyebrow defaulting to Production. */
export function ProductionPageHeader({
  title,
  description,
  eyebrow = 'Production',
  actions,
}: ProductionPageHeaderProps): JSX.Element {
  return <PageHeading eyebrow={eyebrow} title={title} description={description} actions={actions} />
}
