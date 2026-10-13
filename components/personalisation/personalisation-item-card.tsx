'use client'

import dynamic from 'next/dynamic'
import { type JSX, type ReactNode, useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { PersonalisationColour, PersonalisationItem } from '@/lib/validators/personalisation'

// Lazy and client-only, like every other viewer here: three.js is a large
// bundle and this page is opened on a phone, often on mobile data.
const JobModelViewer = dynamic(
  () => import('@/components/production/job-model-viewer').then(m => m.JobModelViewer),
  { ssr: false, loading: () => <ViewerNote>Loading preview…</ViewerNote> },
)

interface PersonalisationItemCardProps {
  token: string
  item: PersonalisationItem
  colours: PersonalisationColour[]
  /** False once the window has closed or the order is confirmed. */
  editable: boolean
}

/**
 * One thing the customer ordered: what it will look like, and the chance to
 * fix what it says.
 *
 * THE MODEL IS NEVER TAKEN AWAY. While a change is rebuilding, the previous
 * picture stays on screen and the Save button carries the waiting - a card
 * that empties itself mid-edit reads as something having gone wrong, and the
 * old picture is still the best answer available to "what am I getting".
 */
export function PersonalisationItemCard({
  token,
  item,
  colours,
  editable,
}: PersonalisationItemCardProps): JSX.Element {
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(item.fields.map(f => [f.label, f.value])),
  )
  const [colour, setColour] = useState(item.colour)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saves, setSaves] = useState(0)

  const { version: modelVersion, rebuilding, ready } = useModel(token, item, saves)
  const dirty = colour !== item.colour || item.fields.some(f => values[f.label] !== f.value)
  // The button owns the whole wait: the request, and the rebuild behind it.
  const busy = sending || rebuilding

  async function save(): Promise<void> {
    setSending(true)
    setError(null)
    try {
      const response = await fetch(
        `/api/p/${encodeURIComponent(token)}/items/${encodeURIComponent(item.job_id)}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fields: values, colour }),
        },
      )
      const body: { detail?: string; saved?: boolean } = await response.json().catch(() => ({}))
      if (!response.ok) {
        // The backend's own sentence. Its refusals name the field and the
        // reason, which is the whole point of refusing in the form.
        setError(body.detail ?? 'Could not save that. Please try again.')
        return
      }
      if (body.saved) setSaves(n => n + 1)
    } catch {
      setError('Could not save that. Please try again.')
    } finally {
      setSending(false)
    }
  }

  const editableFields = item.fields.filter(field => editable && field.editable)
  const readOnlyFields = item.fields.filter(field => !editable || !field.editable)

  return (
    <section className="border-border/60 bg-surface overflow-hidden rounded-2xl border">
      {/* The picture first and full-bleed. On a phone this is the whole
          screen width, which is the only way a 3D model is worth showing at
          all. */}
      <div className="bg-surface-muted relative aspect-square w-full sm:aspect-[4/3]">
        {ready ? (
          <JobModelViewer
            key={modelVersion}
            modelUrl={`/api/p/${encodeURIComponent(token)}/items/${encodeURIComponent(item.job_id)}/model?v=${modelVersion}`}
            showPlate={false}
            captureName={`${item.job_number}.png`}
          />
        ) : (
          <ViewerNote>Building your preview…</ViewerNote>
        )}

        {item.unit_count > 1 ? (
          <span className="bg-surface/90 text-subtle-foreground absolute top-3 left-3 rounded-full px-2.5 py-1 text-xs backdrop-blur">
            {item.unit_index} of {item.unit_count}
          </span>
        ) : null}

        {ready ? (
          <button
            type="button"
            onClick={() => {
              void import('@/components/production/job-model-viewer').then(m =>
                m.downloadViewerImage(`${item.job_number}.png`),
              )
            }}
            className="bg-surface/90 text-muted-foreground hover:text-foreground absolute right-3 bottom-3 rounded-full px-3 py-1.5 text-xs backdrop-blur"
          >
            Save picture
          </button>
        ) : null}
      </div>

      <div className="flex flex-col gap-5 p-4 sm:p-5">
        <header className="flex flex-col gap-0.5">
          <h2 className="text-foreground leading-tight font-medium">{item.product_name}</h2>
          {item.part ? <p className="text-subtle-foreground text-xs">{item.part}</p> : null}
        </header>

        {editableFields.length > 0 ? (
          <div className="flex flex-col gap-3">
            {editableFields.map(field => (
              <div key={field.label} className="flex flex-col gap-1.5">
                <Label htmlFor={`${item.job_id}-${field.label}`} className="text-xs">
                  {field.label}
                </Label>
                <Input
                  id={`${item.job_id}-${field.label}`}
                  value={values[field.label] ?? ''}
                  maxLength={12}
                  // 16px or larger, or iOS zooms the whole page on focus and
                  // the customer loses the layout mid-edit. Capitals because
                  // that is how it is engraved.
                  className="h-12 text-base uppercase"
                  onChange={event => setValues(v => ({ ...v, [field.label]: event.target.value }))}
                />
              </div>
            ))}
          </div>
        ) : null}

        {colours.length > 0 && editable ? (
          <div className="flex flex-col gap-2">
            <span className="text-subtle-foreground text-xs">
              Colour <span className="text-foreground">· {colour}</span>
            </span>
            <div className="flex flex-wrap gap-2.5">
              {colours.map(option => (
                <button
                  key={option.name}
                  type="button"
                  onClick={() => setColour(option.name)}
                  aria-pressed={colour === option.name}
                  aria-label={option.name}
                  title={option.name}
                  // 44px, the smallest target a thumb hits reliably.
                  className={cn(
                    'size-11 rounded-full border transition',
                    colour === option.name
                      ? 'border-foreground ring-foreground/20 ring-2'
                      : 'border-border/70',
                  )}
                  style={{ backgroundColor: option.hex }}
                />
              ))}
            </div>
          </div>
        ) : null}

        {readOnlyFields.length > 0 ? (
          <dl className="border-border/60 flex flex-col gap-1.5 border-t pt-4">
            {readOnlyFields.map(field => (
              <div key={field.label} className="flex justify-between gap-4 text-sm">
                <dt className="text-subtle-foreground">{field.label}</dt>
                <dd className="text-foreground text-right break-words">{field.value}</dd>
              </div>
            ))}
          </dl>
        ) : null}

        {error ? (
          <p role="alert" className="bg-danger-subtle text-danger rounded-lg px-3 py-2 text-sm">
            {error}
          </p>
        ) : null}

        {editable ? (
          <Button
            onClick={() => void save()}
            disabled={!dirty || busy}
            className="h-12 w-full text-base"
          >
            {/* The button carries the wait, including the rebuild - the card
                above it keeps showing the last good picture. */}
            {busy ? (
              <span className="flex items-center gap-2">
                <Spinner />
                {sending ? 'Saving…' : 'Updating your preview…'}
              </span>
            ) : dirty ? (
              'Save changes'
            ) : (
              'Saved'
            )}
          </Button>
        ) : null}
      </div>
    </section>
  )
}

/**
 * Follows the model: whether one exists, and whether it is still the old one.
 *
 * WATCHES THE MODEL'S ID, not merely whether a file answers. A re-render mints
 * a new file rather than overwriting the old one, so the id is an exact signal
 * - and without it the obvious implementation is wrong in the one case that
 * matters: after a save the previous model is still there, answers
 * immediately, and the customer is shown the colour they just changed away
 * from, which reads as the save having failed.
 *
 * Polls briskly. A colour change needs no render at all now, so the new model
 * is usually there within a second, and a five-second poll would make a
 * instant change feel slow.
 */
function useModel(token: string, item: PersonalisationItem, saves: number) {
  const [version, setVersion] = useState(item.model_version)
  const [waiting, setWaiting] = useState(false)

  useEffect(() => {
    if (saves === 0) return
    setWaiting(true)
  }, [saves])

  useEffect(() => {
    if (!waiting) return
    let cancelled = false
    let attempts = 0
    const url = `/api/p/${encodeURIComponent(token)}/items/${encodeURIComponent(item.job_id)}`

    const poll = setInterval(() => {
      attempts += 1
      if (attempts > 90) {
        clearInterval(poll)
        setWaiting(false)
        return
      }
      void fetch(url, { cache: 'no-store' })
        .then(response => (response.ok ? response.json() : null))
        .then((body: { model_version?: string } | null) => {
          const latest = body?.model_version ?? ''
          if (cancelled || !latest || latest === version) return
          setVersion(latest)
          setWaiting(false)
          clearInterval(poll)
        })
        .catch(() => undefined)
    }, 1200)

    return () => {
      cancelled = true
      clearInterval(poll)
    }
  }, [waiting, token, item.job_id, version])

  // A backend that predates model_version sends none, and the model would then
  // never be shown at all. Falling back to model_ready keeps the page working
  // against an older API; it only loses the ability to tell a rebuilt model
  // from the one it replaced, which is exactly what that backend could not
  // tell us anyway.
  const exists = version !== '' ? true : item.model_ready
  // NOT gated on `waiting`. The old picture stays up while the new one builds,
  // because an empty card mid-edit reads as a fault and the old picture is
  // still the best available answer to "what am I getting".
  return { version, rebuilding: waiting, ready: exists }
}

function Spinner(): JSX.Element {
  return (
    <span
      aria-hidden
      className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
    />
  )
}

function ViewerNote({ children }: { children: ReactNode }): JSX.Element {
  return (
    <div className="text-muted-foreground flex h-full w-full items-center justify-center text-sm">
      {children}
    </div>
  )
}
