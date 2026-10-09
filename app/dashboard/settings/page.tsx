import type { Metadata } from 'next'
import Link from 'next/link'
import type { JSX } from 'react'

import { BrandDeleteList } from '@/components/brands/brand-delete-list'
import { SettingsHeader } from '@/components/settings/settings-header'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

import { loadSettingsContext } from './settings-context'

export const metadata: Metadata = { title: 'Workspace settings' }

export const dynamic = 'force-dynamic'

interface WorkspaceSettingsPageProps {
  searchParams: Promise<{ brand?: string }>
}

/**
 * Settings → Workspace: the brands this workspace owns.
 *
 * The landing page of the area, and the only one of the three that is not
 * about a single brand - which is why it is the root rather than one of the
 * sub-routes.
 */
export default async function WorkspaceSettingsPage({
  searchParams,
}: WorkspaceSettingsPageProps): Promise<JSX.Element> {
  const { brand } = await searchParams
  const { brands, loadError } = await loadSettingsContext(brand, '/dashboard/settings')

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-12 sm:px-6">
      <SettingsHeader
        title="Workspace"
        description="The brands this workspace owns, and what happens to them."
      />

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <CardTitle>Brands</CardTitle>
              <CardDescription>
                Delete a brand and everything it owns. To edit a brand&apos;s ladder or thresholds,
                use Brand.
              </CardDescription>
            </div>
            <Link
              href="/dashboard/brands"
              className={buttonVariants({ variant: 'secondary', size: 'sm' })}
            >
              Manage brands
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {loadError ? (
            <p role="alert" className="bg-danger-subtle text-danger rounded-md px-3 py-2 text-sm">
              {loadError}
            </p>
          ) : (
            <BrandDeleteList brands={brands} />
          )}
        </CardContent>
      </Card>
    </main>
  )
}
