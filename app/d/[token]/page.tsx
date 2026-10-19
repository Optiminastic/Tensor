import type { Metadata } from 'next'
import type { JSX } from 'react'

import { DamageReportForm } from '@/components/damage/damage-report-form'
import { fetchDamageForm } from '@/services/damage-form.service'

interface PageProps {
  params: Promise<{ token: string }>
}

/**
 * The damage form a customer opens from WhatsApp.
 *
 * noindex, and that is not optional: the address IS the credential, and a
 * search engine that reached it would publish somebody's photographs of their
 * own home along with it. no-referrer for the same reason - the token must
 * not travel out in a Referer header.
 */
export const metadata: Metadata = {
  title: 'Report damage',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
}

export const dynamic = 'force-dynamic'

export default async function DamagePage({ params }: PageProps): Promise<JSX.Element> {
  const { token } = await params
  const form = await fetchDamageForm(token)

  if (!form) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center gap-3 px-5 py-16">
        <h1 className="text-display text-2xl">This link has closed</h1>
        {/* The same sentence for expired, submitted and never-existed. The
            customer coming back to a timed-out link needs to know what
            happens now, and a stranger guessing learns nothing. */}
        <p className="text-muted-foreground text-pretty">
          Damage links stay open for 24 hours. Message the shop on WhatsApp and they will send you a
          new one.
        </p>
      </main>
    )
  }

  return <DamageReportForm token={token} form={form} />
}
