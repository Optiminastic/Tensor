import type { Metadata } from 'next'
import type { JSX } from 'react'

import { PersonalisationCheck } from '@/components/personalisation/personalisation-check'
import { fetchPersonalisationLink } from '@/services/personalisation.service'

interface PageProps {
  params: Promise<{ token: string }>
}

/**
 * The one page in Tensor a customer sees.
 *
 * noindex, and that is not optional: this address carries somebody's order
 * number and the names they are having engraved. A search engine that reached
 * it would publish them.
 */
export const metadata: Metadata = {
  title: 'Check your order',
  robots: { index: false, follow: false },
  referrer: 'no-referrer',
}

export const dynamic = 'force-dynamic'

export default async function PersonalisationPage({ params }: PageProps): Promise<JSX.Element> {
  const { token } = await params
  const link = await fetchPersonalisationLink(token)

  if (!link) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center gap-3 px-5 py-16">
        <h1 className="text-display text-2xl">This link has closed</h1>
        {/* The same sentence for expired, confirmed and never-existed. A
            customer coming back to a timed-out link needs to know what
            happens now, and a stranger guessing learns nothing. */}
        <p className="text-muted-foreground text-pretty">
          Your order is being made with the details you gave at checkout. If something needs
          changing, message the shop and they will sort it out.
        </p>
      </main>
    )
  }

  return <PersonalisationCheck token={token} link={link} />
}
