import type { Metadata } from 'next'
import type { JSX } from 'react'

import { NonDnpTable } from '@/components/designs/non-dnp-table'
import { requirePermission } from '@/lib/authz'
import { resolveBackendToken } from '@/lib/backend-token'
import type { ProductionJob } from '@/lib/validators/production'
import { DesignJobsServiceError, listDesignJobs } from '@/services/design-jobs.service'

export const metadata: Metadata = { title: 'Non-DNP' }

interface NonDnpPageProps {
  params: Promise<{ brand: string }>
}

/**
 * The jobs a designer has to draw before they can print.
 *
 * Tensor renders the plank family and the products the registry describes;
 * everything else - a Bone Tag, a DUOSNAP, a Couple's Date Plank, a 3D Name
 * Plank - needs a 3MF from a person. Those jobs had no screen of their own:
 * they sat in the production queue, which a designer cannot open.
 *
 * ONLY AFTER THE CUSTOMER'S WINDOW HAS CLOSED. Every personalised order gets
 * thirty minutes in which the customer can still correct a name or a colour,
 * so until that is over anything modelled from it could still move. The
 * backend gates the list on exactly that.
 */
export default async function NonDnpPage({ params }: NonDnpPageProps): Promise<JSX.Element> {
  const { brand } = await params
  await requirePermission('design:job_read', `/dashboard/${brand}`)

  let jobs: ProductionJob[] = []
  let error: string | null = null
  const { token, error: tokenError } = await resolveBackendToken()
  if (!token) {
    error = tokenError ?? 'Your session has expired. Sign in again.'
  } else {
    try {
      jobs = await listDesignJobs(token)
    } catch (err) {
      error =
        err instanceof DesignJobsServiceError ? err.message : 'Could not load the design queue.'
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10 sm:px-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-display text-3xl">Non-DNP</h1>
        <p className="text-muted-foreground text-sm">
          Products Tensor cannot build itself. Upload the 3MF, with its colours, and the job goes to
          the floor.
        </p>
      </div>

      {error ? (
        <p role="alert" className="bg-danger-subtle text-danger rounded-md px-3 py-2 text-sm">
          {error}
        </p>
      ) : (
        <NonDnpTable jobs={jobs} />
      )}
    </main>
  )
}
