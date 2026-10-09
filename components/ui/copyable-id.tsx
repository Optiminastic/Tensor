'use client'

import { Check } from 'lucide-react'
import { type JSX, useState } from 'react'

import { cn } from '@/lib/utils'

interface CopyableIdProps {
  /** The identifier, shown and copied verbatim. */
  value: string
  /** Announced to screen readers in place of "copy <value>". */
  label?: string
  className?: string
}

/**
 * An identifier you can take with you.
 *
 * An id on screen that cannot leave it is half an id: the reason to show one is
 * to paste it into Shopify's search, a spreadsheet or a message to somebody
 * else, and re-typing fourteen digits is how a wrong row gets investigated.
 *
 * The swap to "Copied" is the whole feedback. A `title` tooltip is unreachable
 * on touch and invisible to anyone scanning a table, which is why the repo
 * already rejects it for anything that matters.
 */
export function CopyableId({ value, label, className }: CopyableIdProps): JSX.Element {
  const [copied, setCopied] = useState(false)

  async function copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard access can be denied - an insecure origin, a locked-down
      // browser. The text stays selectable, so this fails quietly rather than
      // throwing an error at somebody who can simply highlight it instead.
      setCopied(false)
    }
  }

  return (
    <button
      type="button"
      onClick={() => void copy()}
      aria-label={copied ? 'Copied' : `Copy ${label ?? value}`}
      className={cn(
        'text-foreground hover:text-accent inline-flex items-center gap-1.5 rounded font-mono text-sm whitespace-nowrap transition-colors',
        'focus-visible:ring-accent/30 focus-visible:ring-2 focus-visible:outline-none',
        className,
      )}
    >
      {value}
      {copied ? (
        <span className="text-success inline-flex items-center gap-0.5 text-xs">
          <Check className="size-3" aria-hidden />
          Copied
        </span>
      ) : null}
    </button>
  )
}
