'use client'

import { ChevronDown, ChevronRight, Eye, EyeOff } from 'lucide-react'
import { type JSX, useState } from 'react'

import {
  disconnectIntegrationAction,
  saveIntegrationAction,
} from '@/app/dashboard/settings/integration-actions'
import { ProviderLogo } from '@/components/brands/provider-logo'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Field } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import type { Integration } from '@/lib/validators/integrations'

interface IntegrationRowProps {
  brandSlug: string
  integration: Integration
}

/**
 * One credential-based integration, with its form.
 *
 * Unlike the OAuth rows above it, these have no redirect to send an admin on -
 * the values are ids and keys copied out of somebody else's console - so the
 * row expands into the form rather than linking away.
 *
 * SECRETS ARE PRE-FILLED BUT MASKED, with a reveal toggle per field.
 *
 * They used to be withheld entirely - the field read "Stored" and a blank
 * submission kept it. That protected less than it looked: integration:manage
 * is held by ADMIN alone (internal/auth/catalog.go), and an admin who cannot
 * read the key can still disconnect the integration outright, so withholding
 * it mostly meant somebody editing the phone number had to trust a label about
 * a value they could not check.
 *
 * Masked by default rather than shown, because the common case is an admin
 * glancing at this page with somebody beside them, and a key in plain sight is
 * readable across a desk. One click when they actually need it, and the reveal
 * resets when the row is collapsed.
 *
 * A blank secret still means KEEP, so clearing the box does not wipe the key.
 */
export function IntegrationRow({ brandSlug, integration }: IntegrationRowProps): JSX.Element {
  const [open, setOpen] = useState(false)
  // Defaults are merged in ONCE, as the initial state, rather than applied at
  // render. Applied at render, clearing the box would snap it back to the
  // default and the field could not be emptied; merged here, it is pre-filled
  // and then behaves like any other input.
  const [values, setValues] = useState<Record<string, string>>(() => {
    const initial = { ...integration.values }
    for (const field of integration.fields ?? []) {
      if (!initial[field.key] && field.default) initial[field.key] = field.default
    }
    return initial
  })
  // Which secret fields are currently unmasked. Cleared when the row is
  // collapsed, so a revealed key is not sitting there waiting to be read the
  // next time somebody opens it.
  const [revealed, setRevealed] = useState<Record<string, boolean>>({})
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const fields = integration.fields ?? []

  async function save(): Promise<void> {
    setSaving(true)
    setError(null)
    setSaved(false)
    const result = await saveIntegrationAction(
      { brand: brandSlug, provider: integration.provider },
      values,
    )
    setSaving(false)
    if (!result.ok) {
      setError(result.error ?? 'Could not save those credentials.')
      return
    }
    setSaved(true)
  }

  async function disconnect(): Promise<void> {
    setSaving(true)
    setError(null)
    const result = await disconnectIntegrationAction(brandSlug, integration.provider)
    setSaving(false)
    if (!result.ok) {
      setError(result.error ?? 'Could not disconnect.')
      return
    }
    setValues({})
    setOpen(false)
  }

  return (
    <div className="border-border/70 border-t py-4 first:border-t-0">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() =>
            setOpen(current => {
              if (current) setRevealed({})
              return !current
            })
          }
          disabled={!integration.available}
          aria-expanded={open}
          className="text-foreground flex items-center gap-2 text-sm font-medium disabled:cursor-not-allowed"
        >
          {integration.available ? (
            open ? (
              <ChevronDown className="text-muted-foreground size-4" aria-hidden />
            ) : (
              <ChevronRight className="text-muted-foreground size-4" aria-hidden />
            )
          ) : (
            <span className="size-4" aria-hidden />
          )}
          <ProviderLogo provider={integration.provider} />
          {integration.label}
        </button>

        {!integration.available ? (
          <Badge tone="neutral">Not available yet</Badge>
        ) : integration.connected ? (
          <Badge tone="success">Connected</Badge>
        ) : (
          <Badge tone="neutral">Not connected</Badge>
        )}

        <span className="text-muted-foreground ml-auto hidden max-w-md text-right text-xs sm:block">
          {integration.summary}
        </span>
      </div>

      {/* A provider Tensor lists but cannot connect yet. Nothing is in this
          state today - WhatsApp was, until there was code that read its token
          - but the branch stays, because listing a planned integration is
          more honest than hiding it, and storing credentials nothing reads
          would put them at risk for no benefit. The sentence comes from the
          backend's own catalogue rather than being written here, so the next
          one does not inherit WhatsApp's explanation. */}
      {!integration.available ? (
        <p className="text-muted-foreground mt-2 text-sm text-pretty">
          {integration.summary} Tensor has nothing that reads these credentials yet, so there is
          nowhere safe to store them.
        </p>
      ) : null}

      {open && integration.available ? (
        <div className="mt-4 flex flex-col gap-4 pl-6">
          {integration.from_environment ? (
            <p className="bg-surface-muted text-muted-foreground rounded-md px-3 py-2 text-sm text-pretty">
              These are the values this deployment was started with, shown so you can see what is in
              use. Saving copies them here, after which this page is where they are changed — and
              the deployment&apos;s own settings stop mattering for this brand.
            </p>
          ) : null}
          {fields.map(field => {
            const stored = integration.secrets_set.includes(field.key)
            const show = revealed[field.key] === true
            return (
              <Field
                key={field.key}
                label={field.label}
                htmlFor={`${integration.provider}-${field.key}`}
                required={field.required && !stored}
                hint={field.help}
              >
                <div className="relative">
                  <Input
                    id={`${integration.provider}-${field.key}`}
                    type={field.secret && !show ? 'password' : 'text'}
                    // off, and deliberately not a password-manager field name:
                    // this is somebody else's API key, not a login, and
                    // offering to save it as one puts it somewhere nobody
                    // meant it to go.
                    autoComplete="off"
                    spellCheck={false}
                    value={values[field.key] ?? ''}
                    placeholder={stored && !values[field.key] ? 'Stored — leave blank to keep' : ''}
                    onChange={event =>
                      setValues(current => ({ ...current, [field.key]: event.target.value }))
                    }
                    className={field.secret ? 'pr-10 font-mono' : undefined}
                  />
                  {field.secret ? (
                    <button
                      type="button"
                      onClick={() =>
                        setRevealed(current => ({ ...current, [field.key]: !current[field.key] }))
                      }
                      aria-label={show ? `Hide ${field.label}` : `Show ${field.label}`}
                      aria-pressed={show}
                      className="text-muted-foreground hover:text-foreground absolute top-1/2 right-2 -translate-y-1/2 rounded-sm p-1 transition-colors"
                    >
                      {show ? (
                        <EyeOff className="size-4" aria-hidden />
                      ) : (
                        <Eye className="size-4" aria-hidden />
                      )}
                    </button>
                  ) : null}
                </div>
              </Field>
            )
          })}

          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={() => void save()} disabled={saving}>
              {saving ? 'Saving…' : 'Save and connect'}
            </Button>
            {integration.connected ? (
              <Button variant="ghost" onClick={() => void disconnect()} disabled={saving}>
                Disconnect
              </Button>
            ) : null}
            {saved ? <span className="text-success text-sm">Saved.</span> : null}
          </div>

          {error ? (
            <p role="alert" className="bg-danger-subtle text-danger rounded-md px-3 py-2 text-sm">
              {error}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
