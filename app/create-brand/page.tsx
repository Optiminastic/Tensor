import type { Metadata } from 'next'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import type { JSX } from 'react'

import { BrandOnboarding } from '@/components/brands/create/brand-onboarding'
import type { ShopifyPrefill } from '@/components/brands/create/types'
import { Logo } from '@/components/logo'
import { getSessionSafe } from '@/lib/auth'
import { env } from '@/lib/env'
import { readPendingCookie } from '@/lib/shopify/pending'

export const metadata: Metadata = { title: 'Set up your brand' }

export const dynamic = 'force-dynamic'

interface CreateBrandPageProps {
  searchParams: Promise<{ shopify?: string }>
}

// A failed or malformed Shopify round-trip lands back here with a reason.
function statusNotice(status: string | undefined): string | null {
  if (status === 'error') return 'Shopify connection failed. Try again, or enter details manually.'
  if (status === 'invalid_shop') return "That doesn't look like a Shopify store domain."
  return null
}

/**
 * The first-run destination after an admin signs up or signs in: a focused,
 * one-step-at-a-time flow to create a brand. Shopify OAuth (when configured)
 * returns here with a prefill. Authorization is enforced by Tensor-Core
 * (`brand:manage`) when the brand is saved.
 */
export default async function CreateBrandPage({
  searchParams,
}: CreateBrandPageProps): Promise<JSX.Element> {
  const session = await getSessionSafe(await headers())
  if (!session) redirect('/login?callbackUrl=/create-brand')

  const shopifyEnabled = Boolean(env.SHOPIFY_API_KEY && env.SHOPIFY_API_SECRET)
  const pending = await readPendingCookie()
  const prefill: ShopifyPrefill | null = pending
    ? {
        shop: pending.shop,
        name: pending.name,
        description: pending.description,
        logoUrl: pending.logoUrl,
        shopUrl: pending.shopUrl,
      }
    : null

  const { shopify: status } = await searchParams
  const notice = statusNotice(status)

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-5xl flex-col gap-10 px-6 py-10">
      <header className="flex items-center justify-between gap-4">
        <Logo />
        <span className="text-muted-foreground hidden text-sm sm:inline">{session.user.email}</span>
      </header>

      {notice ? (
        <p role="alert" className="bg-danger-subtle text-danger rounded-md px-4 py-3 text-sm">
          {notice}
        </p>
      ) : null}

      <BrandOnboarding shopifyEnabled={shopifyEnabled} shopifyPrefill={prefill} />
    </main>
  )
}
