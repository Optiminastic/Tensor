'use client'

import { useState, type JSX } from 'react'

import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'

interface ShopifyConnectStepProps {
  enabled: boolean
  onSkip: () => void
}

/**
 * Step 1: connect the brand's Shopify store via OAuth. The admin enters the store
 * domain and clicks Connect, which hands off to Shopify's consent screen; on
 * return the brand's name and description are prefilled. No token is ever typed
 * or held here. When OAuth is not configured, only manual entry is offered.
 */
export function ShopifyConnectStep({ enabled, onSkip }: ShopifyConnectStepProps): JSX.Element {
  const [domain, setDomain] = useState('')

  // The wizard's own brandless flow, NOT /api/shopify/oauth/install - that one
  // requires an existing brand to bind the OAuth state to, and there is none
  // yet at this point. See app/api/shopify/oauth/start.
  const installHref = `/api/shopify/oauth/start?shop=${encodeURIComponent(domain.trim())}`

  return (
    <div className="flex flex-col gap-5">
      <p className="text-subtle-foreground text-sm">
        Connect your Shopify store and we&apos;ll pull the brand&apos;s name and description so you
        don&apos;t have to type them (add a logo in the next step). You approve the connection on
        Shopify — nothing to copy or paste.
      </p>

      {enabled ? (
        <>
          <Field label="Store domain" htmlFor="shop-domain" hint="e.g. your-store.myshopify.com">
            <Input
              id="shop-domain"
              value={domain}
              onChange={e => setDomain(e.target.value)}
              placeholder="your-store.myshopify.com"
              autoFocus
            />
          </Field>

          <div className="flex items-center gap-2">
            {/* A full-page navigation, not fetch: OAuth redirects the browser to
                Shopify and back. Disabled until a domain is entered. */}
            <Button
              type="button"
              onClick={() => {
                window.location.href = installHref
              }}
              disabled={domain.trim() === ''}
              className="self-start"
            >
              Connect with Shopify
            </Button>
            <Button type="button" variant="ghost" onClick={onSkip} className="self-start">
              Skip and enter manually
            </Button>
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="bg-surface-muted text-subtle-foreground rounded-md px-3 py-2 text-sm">
            Shopify connect is not configured yet. You can enter the brand&apos;s details by hand
            and connect Shopify later from the brand&apos;s page.
          </p>
          <Button type="button" onClick={onSkip} className="self-start">
            Enter details manually
          </Button>
        </div>
      )}
    </div>
  )
}
