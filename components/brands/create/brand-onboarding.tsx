'use client'

import { Check } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { useRouter } from 'next/navigation'
import { useState, type JSX } from 'react'

import {
  createBrand,
  finalizeShopifyConnection,
  saveConnection,
} from '@/app/dashboard/brands/actions'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { type ConnectionProvider, PROVIDER_LABELS } from '@/lib/validators/connections'

import { BrandBasicsStep } from './brand-basics-step'
import { IntegrationStep } from './integration-step'
import { ShopifyConnectStep } from './shopify-connect-step'
import {
  type BrandBasicsDraft,
  type ConnectionDrafts,
  EMPTY_CONNECTION,
  EMPTY_SHOPIFY,
  type ShopifyDraft,
  type ShopifyPrefill,
  toBrandCreateInput,
} from './types'

// Shopify is captured first (step 0) via OAuth and pulls the brand identity. The
// two ad platforms are the remaining connect steps.
const AD_PROVIDERS: ConnectionProvider[] = ['google_ads', 'meta_ads']
const STEP_LABELS = ['Shopify', 'Brand', ...AD_PROVIDERS.map(p => PROVIDER_LABELS[p])]

// Google Analytics connects via OAuth on the brand's Integrations page after
// creation, so it is not an onboarding step; the empty draft satisfies the
// per-provider record without adding a manual step here.
function initialConnections(): ConnectionDrafts {
  return {
    google_ads: EMPTY_CONNECTION,
    google_analytics: EMPTY_CONNECTION,
    meta_ads: EMPTY_CONNECTION,
    shopify: EMPTY_CONNECTION,
  }
}

interface BrandOnboardingProps {
  shopifyEnabled: boolean
  shopifyPrefill: ShopifyPrefill | null
}

export function BrandOnboarding({
  shopifyEnabled,
  shopifyPrefill,
}: BrandOnboardingProps): JSX.Element {
  const router = useRouter()
  // A Shopify OAuth round-trip returns here with a prefill, so start on the Brand
  // step with the pulled details already in place.
  const [step, setStep] = useState(shopifyPrefill ? 1 : 0)
  const [shopify, setShopify] = useState<ShopifyDraft>(
    shopifyPrefill
      ? { connected: true, domain: shopifyPrefill.shop, shopUrl: shopifyPrefill.shopUrl }
      : EMPTY_SHOPIFY,
  )
  const [basics, setBasics] = useState<BrandBasicsDraft | null>(
    shopifyPrefill
      ? {
          name: shopifyPrefill.name,
          slug: '',
          description: shopifyPrefill.description,
          logoUrl: shopifyPrefill.logoUrl,
        }
      : null,
  )
  const [connections, setConnections] = useState<ConnectionDrafts>(initialConnections)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function persistAds(slug: string, conns: ConnectionDrafts): Promise<void> {
    for (const provider of AD_PROVIDERS) {
      const draft = conns[provider]
      if (!draft.connected) continue
      await saveConnection(slug, provider, {
        status: 'connected',
        external_account_id: draft.externalAccountId || null,
        access_token: draft.accessToken || null,
      })
    }
  }

  async function finish(conns: ConnectionDrafts): Promise<void> {
    if (!basics) return
    setCreating(true)
    setError(null)
    const result = await createBrand(toBrandCreateInput(basics, shopify.shopUrl || null))
    if (!result.ok || !result.data) {
      setCreating(false)
      setError(result.error ?? 'Could not create the brand.')
      return
    }
    const slug = result.data.slug
    try {
      // The Shopify token was stashed server-side during OAuth; attach it now.
      if (shopify.connected) await finalizeShopifyConnection(slug)
      await persistAds(slug, conns)
    } catch {
      // The brand exists; a failed connection is editable later on its page.
    }
    if (shopify.connected && shopify.domain) {
      // The onboarding connect above only pulled brand details (a separate
      // Shopify app/scope, see shopify-order-import.tsx) - chain straight into
      // the real order-import OAuth grant for the same store so paid/COD
      // orders start flowing in via webhook without a second manual step.
      // A top-level navigation, not router.push: this leaves the app for
      // Shopify's consent screen and returns via Tensor-Core's callback.
      window.location.href = `/api/shopify/orders/connect?brand=${encodeURIComponent(slug)}&shop_domain=${encodeURIComponent(shopify.domain)}`
      return
    }
    router.push(`/dashboard/${slug}`)
    router.refresh()
  }

  function onShopifySkip(): void {
    setShopify(EMPTY_SHOPIFY)
    setError(null)
    setStep(1)
  }

  function onAdProvider(providerIndex: number, draft: ConnectionDrafts[ConnectionProvider]): void {
    const provider = AD_PROVIDERS[providerIndex]
    const merged = { ...connections, [provider]: draft }
    setConnections(merged)
    setError(null)
    if (providerIndex < AD_PROVIDERS.length - 1) setStep(step + 1)
    else void finish(merged)
  }

  const activeIndex = creating || error ? STEP_LABELS.length : step
  const stateKey = creating ? 'creating' : error ? 'error' : `step-${step}`

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)]">
      <ProgressAside activeIndex={activeIndex} />

      <div className="relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={stateKey}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.28, ease: 'easeInOut' }}
            className="border-border bg-surface rounded-lg border p-6 shadow-sm"
          >
            {creating ? (
              <StepFrame title="Creating your brand…">
                <p className="text-muted-foreground text-sm">
                  {shopify.connected
                    ? "Saving your brand, then we'll ask Shopify for permission to import orders."
                    : 'Saving your brand and connections.'}
                </p>
              </StepFrame>
            ) : error ? (
              <StepFrame title="Something went wrong">
                <p
                  role="alert"
                  className="bg-danger-subtle text-danger rounded-md px-3 py-2 text-sm"
                >
                  {error}
                </p>
                <Button
                  type="button"
                  onClick={() => void finish(connections)}
                  className="self-start"
                >
                  Try again
                </Button>
              </StepFrame>
            ) : step === 0 ? (
              <StepFrame title="Connect Shopify">
                <ShopifyConnectStep enabled={shopifyEnabled} onSkip={onShopifySkip} />
              </StepFrame>
            ) : step === 1 ? (
              <StepFrame title="Brand details" onBack={() => setStep(0)}>
                <BrandBasicsStep
                  initial={basics}
                  onDone={next => {
                    setBasics(next)
                    setStep(2)
                  }}
                />
              </StepFrame>
            ) : (
              <StepFrame
                title={PROVIDER_LABELS[AD_PROVIDERS[step - 2]]}
                onBack={() => setStep(step - 1)}
              >
                <IntegrationStep
                  provider={AD_PROVIDERS[step - 2]}
                  initial={connections[AD_PROVIDERS[step - 2]]}
                  onDone={draft => onAdProvider(step - 2, draft)}
                />
              </StepFrame>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

interface StepFrameProps {
  title: string
  onBack?: () => void
  children: React.ReactNode
}

function StepFrame({ title, onBack, children }: StepFrameProps): JSX.Element {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-medium">{title}</h2>
        {onBack ? (
          <Button type="button" variant="ghost" size="sm" onClick={onBack}>
            Back
          </Button>
        ) : null}
      </div>
      {children}
    </div>
  )
}

interface ProgressAsideProps {
  activeIndex: number
}

function ProgressAside({ activeIndex }: ProgressAsideProps): JSX.Element {
  return (
    <aside className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <p className="text-subtle-foreground text-xs font-medium tracking-wide uppercase">
          Step {Math.min(activeIndex + 1, STEP_LABELS.length)} of {STEP_LABELS.length}
        </p>
        <h1 className="text-display text-3xl">Let&apos;s set up your brand</h1>
        <p className="text-muted-foreground text-sm text-pretty">
          Connect Shopify to pull your brand&apos;s details, then link your ad platforms. You can
          refine pricing and change connections any time from the brand&apos;s page.
        </p>
      </div>

      <ol className="flex flex-col gap-1">
        {STEP_LABELS.map((label, i) => {
          const done = i < activeIndex
          const active = i === activeIndex
          return (
            <li key={label} className="flex items-center gap-3 py-1">
              <span
                className={cn(
                  'flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium',
                  done
                    ? 'bg-success-subtle text-success'
                    : active
                      ? 'bg-accent text-accent-foreground'
                      : 'bg-surface-muted text-subtle-foreground',
                )}
                aria-hidden
              >
                {done ? <Check className="size-3.5" /> : i + 1}
              </span>
              <span
                className={cn(
                  'text-sm',
                  active ? 'text-foreground font-medium' : 'text-muted-foreground',
                )}
              >
                {label}
              </span>
            </li>
          )
        })}
      </ol>
    </aside>
  )
}
