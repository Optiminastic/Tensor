import type { Metadata } from 'next'
import type { JSX } from 'react'

import { DesignsView } from '@/components/designs/designs-view'
import { UploadDesignDialog } from '@/components/designs/upload-design-dialog'
import { resolveBackendToken } from '@/lib/backend-token'
import type { Design } from '@/lib/validators/designs'
import { DesignServiceError, listDesigns } from '@/services/designs.service'

export const metadata: Metadata = { title: 'Designs' }

interface DesignsPageProps {
  params: Promise<{ brand: string }>
}

/**
 * A brand's designs: upload a model to run the pre-check, and track every design
 * from queued through the Green/Yellow/Red verdict.
 */
export default async function DesignsPage({ params }: DesignsPageProps): Promise<JSX.Element> {
  const { brand } = await params

  let designs: Design[] = []
  let error: string | null = null
  const { token, error: tokenError } = await resolveBackendToken()
  if (!token) {
    error = tokenError ?? 'Your session has expired. Sign in again.'
  } else {
    try {
      designs = await listDesigns(token, brand)
    } catch (err) {
      error = err instanceof DesignServiceError ? err.message : 'Could not load designs.'
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="text-display text-3xl">Designs</h1>
          <p className="text-muted-foreground text-sm">
            Upload a model, get the Green/Yellow/Red pre-check, and iterate until it is green.
          </p>
        </div>
        <UploadDesignDialog brand={brand} />
      </div>

      {error ? (
        <p role="alert" className="bg-danger-subtle text-danger rounded-md px-3 py-2 text-sm">
          {error}
        </p>
      ) : (
        <DesignsView brand={brand} designs={designs} />
      )}
    </main>
  )
}
