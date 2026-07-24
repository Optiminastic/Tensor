'use client'

import { useState, type JSX } from 'react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface InviteLinkProps {
  url: string
  email: string
  /** Whether the invitation email actually went out. */
  emailed: boolean
  /** Why it did not, when it did not. Safe to show. */
  emailError?: string
}

/**
 * The one-time invitation link.
 *
 * Tensor-Core stores only a hash of the token, so this link cannot be shown
 * again — reloading the page loses it and the only remedy is a fresh invite.
 * The copy is blunt about that on purpose.
 *
 * The link is shown whether or not the email sent. Mail is delivery, not the
 * mechanism: if it failed, or nobody checks their inbox, the admin still has
 * the one thing that actually works.
 */
export function InviteLink({ url, email, emailed, emailError }: InviteLinkProps): JSX.Element {
  const [copied, setCopied] = useState(false)

  async function copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard access can be denied; the link is selectable either way.
      setCopied(false)
    }
  }

  return (
    <Card className="border-accent">
      <CardContent className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <p className="text-foreground text-sm font-medium">Invitation for {email}</p>
          <p className="text-muted-foreground text-sm text-pretty">
            {emailed ? (
              <>
                Emailed to <span className="text-foreground">{email}</span>. Keep this link as a
                backup — mail can be slow, filtered, or missed.
              </>
            ) : (
              <>Send this link to them.</>
            )}{' '}
            It works <strong className="text-foreground">once</strong> and expires in 72 hours. It
            is shown only now — if you lose it, create a new invitation.
          </p>
        </div>

        {!emailed && emailError ? (
          <p className="bg-warning-subtle text-warning rounded-md px-3 py-2 text-sm">
            {emailError} The invitation is still valid — share the link below.
          </p>
        ) : null}

        <div className="flex items-center gap-2">
          <code className="bg-surface-muted text-foreground min-w-0 flex-1 truncate rounded-md px-3 py-2 font-mono text-xs">
            {url}
          </code>
          <Button type="button" onClick={copy} variant="secondary" className="shrink-0">
            {copied ? 'Copied' : 'Copy'}
          </Button>
        </div>

        <p className="text-subtle-foreground text-xs">
          Never send a password — they set their own, and nobody else ever knows it.
        </p>
      </CardContent>
    </Card>
  )
}
