import type { Metadata } from 'next'
import type { JSX } from 'react'

export const metadata: Metadata = { title: 'Overview' }

interface BrandOverviewPageProps {
  params: Promise<{ brand: string }>
}

/**
 * A brand's overview. Blank for now — the KPIs and pricing summary land here
 * next.
 */
export default async function BrandOverviewPage({
  params,
}: BrandOverviewPageProps): Promise<JSX.Element> {
  const { brand } = await params
  return (
    <main className="px-8 py-10">
      <h1 className="text-display text-3xl">Overview</h1>
      <p className="text-subtle-foreground mt-2 text-sm">{brand} - content coming soon.</p>
    </main>
  )
}
