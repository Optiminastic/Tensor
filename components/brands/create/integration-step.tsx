'use client'

import { useState, type JSX } from 'react'

import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { type ConnectionProvider, PROVIDER_LABELS } from '@/lib/validators/connections'

import type { ConnectionDraft } from './types'

interface IntegrationStepProps {
  provider: ConnectionProvider
  initial: ConnectionDraft
  onDone: (draft: ConnectionDraft) => void
}

/**
 * Captures a brand's link to one ad/commerce platform. OAuth needs each
 * provider's app credentials, which arrive later; until then the account id (and
 * an optional token) can be entered manually, or the step skipped. Whatever is
 * captured is persisted right after the brand is created.
 */
export function IntegrationStep({ provider, initial, onDone }: IntegrationStepProps): JSX.Element {
  const label = PROVIDER_LABELS[provider]
  const [accountId, setAccountId] = useState(initial.externalAccountId)
  const [token, setToken] = useState(initial.accessToken)

  function connect(): void {
    onDone({ connected: true, externalAccountId: accountId.trim(), accessToken: token.trim() })
  }

  function skip(): void {
    onDone({ connected: false, externalAccountId: '', accessToken: '' })
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-subtle-foreground text-sm">
        Link this brand&apos;s {label} account. Full OAuth turns on once {label} credentials are
        configured; for now enter the account id to link it, or skip and connect later.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={`${label} account id`} htmlFor={`${provider}-acct`} hint="Optional">
          <Input
            id={`${provider}-acct`}
            value={accountId}
            onChange={e => setAccountId(e.target.value)}
            placeholder="e.g. 123-456-7890"
          />
        </Field>
        <Field label="Access token" htmlFor={`${provider}-token`} hint="Optional, stored securely">
          <Input
            id={`${provider}-token`}
            type="password"
            value={token}
            onChange={e => setToken(e.target.value)}
            autoComplete="off"
          />
        </Field>
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          onClick={connect}
          disabled={accountId.trim() === ''}
          className="self-start"
        >
          Connect {label}
        </Button>
        <Button type="button" variant="ghost" onClick={skip} className="self-start">
          Skip for now
        </Button>
      </div>
    </div>
  )
}
