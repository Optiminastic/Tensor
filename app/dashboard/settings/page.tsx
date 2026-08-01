import type { Metadata } from 'next'
import { headers } from 'next/headers'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import type { JSX } from 'react'

import { BrandDeleteList } from '@/components/brands/brand-delete-list'
import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { auth } from '@/lib/auth'
import type { BrandProfile } from '@/lib/validators/brands'
import { listBrands } from '@/services/brands.service'

export const metadata: Metadata = { title: 'Settings' }

export const dynamic = 'force-dynamic'

/**
 * Workspace settings. The Brands section deletes a brand and everything it owns;
 * full editing (ladder, thresholds, connections) lives on the Brands page.
 * Authorization is enforced by Tensor-Core when a delete is submitted.
 */
export default async function SettingsPage(): Promise<JSX.Element> {
  const requestHeaders = await headers()
  const session = await auth.api.getSession({ headers: requestHeaders })
  if (!session) redirect('/login?callbackUrl=/dashboard/settings')

  let brands: BrandProfile[] = []
  let loadError: string | null = null
  try {
    const token = await auth.api.getToken({ headers: requestHeaders })
    if (token?.token) brands = await listBrands(token.token)
  } catch (error) {
    loadError = error instanceof Error ? error.message : 'Could not load brands.'
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-6 py-12">
      <div className="flex flex-col gap-2">
        <h1 className="text-display text-4xl">Settings</h1>
        <p className="text-muted-foreground max-w-prose text-sm text-pretty">
          Workspace and account settings.
        </p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-1">
              <CardTitle>Brands</CardTitle>
              <CardDescription>
                Delete a brand and everything it owns. To edit a brand&apos;s ladder, thresholds or
                connections, use the Brands page.
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
