import type { Metadata } from 'next'
import type { JSX } from 'react'

import { PageHeading } from '@/components/dashboard/page-heading'
import { PRODUCTION_TABS, RegistryTabs } from '@/components/production/registry-tabs'
import { requirePermission } from '@/lib/authz'
import { resolveBackendToken } from '@/lib/backend-token'
import type { PartFile } from '@/lib/validators/part-files'
import type { DesignTemplate } from '@/lib/validators/registry'
import { listDesignTemplates } from '@/services/design-templates.service'
import { listPartFiles } from '@/services/part-files.service'

export const metadata: Metadata = { title: 'Slicing settings' }

interface RegistryPageProps {
  params: Promise<{ brand: string }>
}

/**
 * The registry's production half: which file a SKU prints from, and how it
 * slices.
 *
 * The rest of it - products, their components, the field mappings that fill a
 * design - is authoring, and lives under Designs at /designs/registry. Those
 * are decisions about what the shop MAKES, taken by whoever knows the models.
 * These two are what the floor reads while printing.
 *
 * Same endpoints and the same guard as the full page: a narrower view, not a
 * second copy, so nothing can drift between them.
 *
 * It fetches the templates and the part files - both of which the Designs tab
 * lists. The Products and Components tabs are not here, so the per-product
 * detail calls behind them are not made either, which is the point of
 * narrowing a page rather than hiding its tabs.
 *
 * Guarded on registry:read, as before. An Operator needs this page: which file
 * a SKU prints from is what running a bed requires.
 */
export default async function SlicingSettingsPage({
  params,
}: RegistryPageProps): Promise<JSX.Element> {
  const { brand } = await params
  await requirePermission('registry:read', `/dashboard/${brand}`)

  let templates: DesignTemplate[] = []
  let partFiles: PartFile[] = []
  let error: string | null = null
  const { token, error: tokenError } = await resolveBackendToken()
  if (!token) {
    error = tokenError ?? 'Your session has expired. Sign in again.'
  } else {
    try {
      partFiles = await listPartFiles(token).catch(() => [])
      templates = await listDesignTemplates(token)
    } catch {
      // The Designs tab renders empty rather than failing the page, and
      // Slicing beside it fetches its own rows regardless.
      templates = []
    }
  }

  return (
    <main className="flex w-full flex-col gap-8 px-4 py-10 sm:px-6 md:px-8">
      {error ? (
        <p role="alert" className="bg-danger-subtle text-danger rounded-2xl px-4 py-3 text-sm">
          {error}
        </p>
      ) : (
        <>
          <PageHeading
            eyebrow="Production"
            title="Slicing settings"
            description={
              <>
                The files each SKU prints from, and the slicer settings it prints with. Products and
                components are edited under Designs.
              </>
            }
          />
          <RegistryTabs
            brand={brand}
            components={[]}
            products={[]}
            templates={templates}
            partFiles={partFiles}
            only={PRODUCTION_TABS}
          />
        </>
      )}
    </main>
  )
}
