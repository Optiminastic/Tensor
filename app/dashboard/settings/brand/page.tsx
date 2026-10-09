import type { Metadata } from 'next'
import type { JSX } from 'react'

import { BrandEditor } from '@/components/brands/brand-editor'
import { NoBrandChosen, SettingsHeader } from '@/components/settings/settings-header'

import { loadSettingsContext } from '../settings-context'

export const metadata: Metadata = { title: 'Brand settings' }

export const dynamic = 'force-dynamic'

interface BrandSettingsPageProps {
  searchParams: Promise<{ brand?: string }>
}

/** Settings → Brand: one brand's identity, pricing ladder and CP thresholds. */
export default async function BrandSettingsPage({
  searchParams,
}: BrandSettingsPageProps): Promise<JSX.Element> {
  const { brand } = await searchParams
  const { profile } = await loadSettingsContext(brand, '/dashboard/settings/brand')

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-12 sm:px-6">
      <SettingsHeader
        title="Brand"
        description={
          profile
            ? `${profile.name}: identity, pricing ladder and CP thresholds.`
            : 'Identity, pricing ladder and CP thresholds.'
        }
      />

      {profile ? (
        <BrandEditor brand={profile} />
      ) : (
        <NoBrandChosen what="Brand settings" why="identity, pricing ladder and CP thresholds" />
      )}
    </main>
  )
}
