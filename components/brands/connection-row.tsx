'use client'

import { useRouter } from 'next/navigation'
import { useState, type JSX } from 'react'

import { removeConnection, saveConnection } from '@/app/dashboard/brands/actions'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
  type Connection,
  type ConnectionProvider,
  PROVIDER_LABELS,
} from '@/lib/validators/connections'

// Providers whose "Connect" runs the Google OAuth flow rather than manual entry.
const GOOGLE_PROVIDERS: ReadonlySet<ConnectionProvider> = new Set([
  'google_ads',
  'google_analytics',
])

interface ConnectionRowProps {
  brandSlug: string
  provider: ConnectionProvider
  connection: Connection | null
  googleOAuthConfigured: boolean
}

/**
 * One provider's connection for a brand: shows its status and lets an admin link
 * it (account id, optional token) or disconnect it. OAuth lights up once the
 * provider's credentials are configured; manual linking works in the meantime.
 */
export function ConnectionRow({
  brandSlug,
  provider,
  connection,
  googleOAuthConfigured,
}: ConnectionRowProps): JSX.Element {
  const router = useRouter()
  const connected = connection?.status === 'connected'
  // Google providers connect via OAuth (a redirect), not the manual token form.
  const useGoogleOAuth = googleOAuthConfigured && GOOGLE_PROVIDERS.has(provider)
  const installHref = `/api/google/oauth/install?brand=${encodeURIComponent(
    brandSlug,
  )}&provider=${provider}`
  const [editing, setEditing] = useState(false)
  const [accountId, setAccountId] = useState(connection?.external_account_id ?? '')
  const [token, setToken] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function connect(): Promise<void> {
    setBusy(true)
    setError(null)
    const result = await saveConnection(brandSlug, provider, {
      status: 'connected',
      external_account_id: accountId.trim() || null,
      access_token: token.trim() || null,
    })
    setBusy(false)
    if (!result.ok) {
      setError(result.error ?? 'Could not save the connection.')
      return
    }
    setEditing(false)
    setToken('')
    router.refresh()
  }

  async function disconnect(): Promise<void> {
    setBusy(true)
    setError(null)
    const result = await removeConnection(brandSlug, provider)
    setBusy(false)
    if (!result.ok) {
      setError(result.error ?? 'Could not disconnect.')
      return
    }
    router.refresh()
  }

  return (
    <div className="border-border flex flex-col gap-3 border-b py-3 last:border-b-0">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium">{PROVIDER_LABELS[provider]}</span>
          <Badge tone={connected ? 'success' : 'neutral'}>
            {connected ? 'Connected' : 'Not connected'}
          </Badge>
          {connection?.external_account_id ? (
            <span className="text-subtle-foreground font-mono text-xs">
              {connection.external_account_id}
            </span>
          ) : null}
        </div>
        {connected ? (
          <Button type="button" variant="ghost" size="sm" onClick={disconnect} disabled={busy}>
            {busy ? 'Working…' : 'Disconnect'}
          </Button>
        ) : useGoogleOAuth ? (
          <a
            href={installHref}
            className={cn(buttonVariants({ variant: 'secondary', size: 'sm' }))}
          >
            Connect with Google
          </a>
        ) : (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => setEditing(v => !v)}
            disabled={busy}
          >
            {editing ? 'Cancel' : 'Connect'}
          </Button>
        )}
      </div>

      {error ? (
        <p role="alert" className="text-danger text-xs">
          {error}
        </p>
      ) : null}

      {editing && !connected ? (
        <div className="flex flex-wrap items-end gap-2">
          <Input
            aria-label={`${PROVIDER_LABELS[provider]} account id`}
            placeholder="Account id"
            value={accountId}
            onChange={e => setAccountId(e.target.value)}
            className="w-48"
          />
          <Input
            aria-label={`${PROVIDER_LABELS[provider]} access token`}
            placeholder="Access token (optional)"
            type="password"
            autoComplete="off"
            value={token}
            onChange={e => setToken(e.target.value)}
            className="w-56"
          />
          <Button
            type="button"
            size="sm"
            onClick={connect}
            disabled={busy || accountId.trim() === ''}
          >
            {busy ? 'Saving…' : 'Save'}
          </Button>
        </div>
      ) : null}
    </div>
  )
}
