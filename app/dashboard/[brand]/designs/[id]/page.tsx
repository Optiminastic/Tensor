import { notFound } from 'next/navigation'
import type { JSX } from 'react'

import { DesignDetailView } from '@/components/designs/design-detail'
import { resolveBackendToken } from '@/lib/backend-token'
import type { DesignDetail } from '@/lib/validators/designs'
import { DesignServiceError, getDesign } from '@/services/designs.service'

interface DesignDetailPageProps {
  params: Promise<{ brand: string; id: string }>
}

/** One design's pre-check: metrics, Design CP, verdict, suggestions, and re-slice. */
export default async function DesignDetailPage({
  params,
}: DesignDetailPageProps): Promise<JSX.Element> {
  const { brand, id } = await params

  const { token, error } = await resolveBackendToken()
  if (!token) {
    return (
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-10">
        <p role="alert" className="bg-danger-subtle text-danger rounded-md px-3 py-2 text-sm">
          {error ?? 'Your session has expired. Sign in again.'}
        </p>
      </main>
    )
  }

  let initial: DesignDetail
  try {
    initial = await getDesign(token, id)
  } catch (err) {
    if (err instanceof DesignServiceError) notFound()
    throw err
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-10">
      <DesignDetailView brand={brand} initial={initial} />
    </main>
  )
}
