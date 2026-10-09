'use client'

import { Check, Phone, PhoneOff } from 'lucide-react'
import { type JSX, useState, useTransition } from 'react'

import { placeAgentCallAction } from '@/app/dashboard/[brand]/agent/actions'
import { Button } from '@/components/ui/button'
import type { AbandonedCheckout } from '@/lib/validators/abandoned-checkouts'

/**
 * Everything in the basket, as one phrase the agent can say.
 *
 * All the titles, not just the first: a customer who left a Dual Name Plank
 * AND a Soulmate Combo hears about both, and hearing only one is how a call
 * sounds like it is about somebody else's basket.
 *
 * Titles only - no variant, no SKU. "Dual Name Plank - Blue / DNP-BLU" is our
 * filing system read down a phone.
 */
export function productPhrase(checkout: AbandonedCheckout): string {
  const titles = [...new Set(checkout.line_items.map(li => li.title.trim()).filter(Boolean))]
  if (titles.length === 0) return ''
  // "A and B" for two, "A, B and C" beyond - how a person lists things aloud.
  const phrase =
    titles.length === 1
      ? titles[0]
      : `${titles.slice(0, -1).join(', ')} and ${titles[titles.length - 1]}`
  // The agent's limit. Truncating at a comma keeps it a sentence rather than
  // cutting a product name in half.
  if (phrase.length <= 160) return phrase
  const cut = phrase.slice(0, 160)
  const lastComma = cut.lastIndexOf(',')
  return lastComma > 40 ? cut.slice(0, lastComma) : cut.trimEnd()
}

/**
 * The cart total as a number to be spoken.
 *
 * Shopify sends "3499.00". Said out loud that is "three thousand four hundred
 * and ninety nine point zero zero", so whole rupees lose their decimals.
 * Grouping commas are left out on purpose - they help a reader and confuse a
 * text-to-speech engine.
 */
export function spokenAmount(amount: string): string {
  const value = Number(amount)
  if (!Number.isFinite(value)) return amount
  return Number.isInteger(value) ? String(value) : value.toFixed(2)
}

type Phase = 'idle' | 'confirming' | 'done'

interface CallCheckoutButtonProps {
  checkout: AbandonedCheckout
  disabled: boolean
}

/**
 * Rings the customer whose row this is.
 *
 * Two clicks, not one. The first arms it and names who is about to be phoned;
 * the second dials. A single-click control in a table row means one stray
 * click phones a stranger about their shopping - and unlike every other
 * mistake on this page, that one cannot be undone once it connects.
 *
 * The details are read off the row rather than typed, so what the agent says
 * always matches what the table shows.
 */
export function CallCheckoutButton({ checkout, disabled }: CallCheckoutButtonProps): JSX.Element {
  const [pending, startTransition] = useTransition()
  const [phase, setPhase] = useState<Phase>('idle')
  const [error, setError] = useState<string | null>(null)

  const hasPhone = checkout.phone.trim() !== ''
  const name = checkout.customer_name.trim()

  function dial(): void {
    setError(null)
    startTransition(async () => {
      const result = await placeAgentCallAction({
        customerName: name,
        customerNumber: checkout.phone,
        productName: productPhrase(checkout),
        cartValue: spokenAmount(checkout.total_amount),
        itemCount: checkout.item_count > 0 ? checkout.item_count : undefined,
      })
      if (!result.ok) {
        setError(result.error ?? 'The call could not be placed.')
        setPhase('idle')
        return
      }
      setPhase('done')
    })
  }

  // A cart that converted is not a win-back. The row stays - tracking what
  // happened to a checkout is the point of this table - but the button goes.
  // Shopify keeps recovered checkouts in the abandoned list, so without this
  // the most embarrassing call the feature can place is also the easiest one
  // to make by accident.
  if (checkout.completed_at) {
    return (
      <span className="text-success inline-flex items-center gap-1.5 text-xs font-medium">
        <Check className="size-3.5" aria-hidden />
        Recovered
      </span>
    )
  }

  if (!hasPhone) {
    return (
      <span className="text-subtle-foreground inline-flex items-center gap-1.5 text-xs">
        <PhoneOff className="size-3.5" aria-hidden />
        No number
      </span>
    )
  }

  if (phase === 'done') {
    return (
      <span className="text-success inline-flex items-center gap-1.5 text-xs font-medium">
        <Check className="size-3.5" aria-hidden />
        Calling
      </span>
    )
  }

  if (phase === 'confirming') {
    return (
      <span className="inline-flex items-center gap-2">
        <Button size="sm" onClick={dial} disabled={pending}>
          {pending ? 'Calling…' : `Call ${name.split(' ')[0] || 'now'}`}
        </Button>
        <button
          type="button"
          onClick={() => setPhase('idle')}
          disabled={pending}
          className="text-muted-foreground hover:text-foreground text-xs underline underline-offset-2"
        >
          Cancel
        </button>
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-2">
      <Button
        size="icon"
        variant="ghost"
        onClick={() => setPhase('confirming')}
        disabled={disabled}
        title={disabled ? 'Voice calling is not configured' : `Call ${name || checkout.phone}`}
        aria-label={`Call ${name || checkout.phone}`}
      >
        <Phone className="size-4" aria-hidden />
      </Button>
      {error ? (
        <span role="alert" className="text-danger max-w-[16rem] text-xs">
          {error}
        </span>
      ) : null}
    </span>
  )
}
