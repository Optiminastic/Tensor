'use client'

import dynamic from 'next/dynamic'
import { type JSX, useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import type { PersonalisationColour, PersonalisationItem } from '@/lib/validators/personalisation'

// Lazy and client-only, like every other viewer here: three.js is a large
// bundle and this page is opened on a phone, often on mobile data.
const JobModelViewer = dynamic(
  () => import('@/components/production/job-model-viewer').then(m => m.JobModelViewer),
  { ssr: false, loading: () => <ViewerPlaceholder text="Loading preview…" /> },
)

interface PersonalisationItemCardProps {
  token: string
  item: PersonalisationItem
  colours: PersonalisationColour[]
  /** False once the window has closed or the order is confirmed. */
  editable: boolean
}

/**
 * One thing the customer ordered: what it says, what it will look like, and
 * the chance to fix it.
 *
 * THE WORDS COME FIRST AND THE MODEL SECOND. The preview is 20-45 seconds
 * behind the link, and the spelling is what they came to check - putting a
 * loading viewer above it would hide the only part that is ready.
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
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Bumped after a save so the viewer refetches rather than showing the model
  // the customer just changed.
  const [saves, setSaves] = useState(0)

  const { version: modelVersion, rebuilding, ready } = useModel(token, item, saves)
  const dirty = colour !== item.colour || item.fields.some(f => values[f.label] !== f.value)

  async function save(): Promise<void> {
    setSaving(true)
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
      setSaving(false)
    }
  }

  return (
    <section className="border-border/70 flex flex-col gap-4 rounded-xl border p-4">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-foreground font-medium">
          {item.product_name}
          {/* Three identical headings with different names under them is a
              page nobody can check. */}
          {item.unit_count > 1 ? (
            <span className="text-muted-foreground font-normal">
              {' '}
              — {item.unit_index} of {item.unit_count}
            </span>
          ) : null}
        </h2>
        {item.quantity > 1 ? (
          <span className="text-subtle-foreground text-xs">× {item.quantity}</span>
        ) : null}
      </header>

      <div className="flex flex-col gap-3">
        {item.fields.map(field =>
          editable && field.editable ? (
            <div key={field.label} className="flex flex-col gap-1">
              <Label htmlFor={`${item.job_id}-${field.label}`} className="text-xs">
                {field.label}
              </Label>
              <Input
                id={`${item.job_id}-${field.label}`}
                value={values[field.label] ?? ''}
                maxLength={12}
                // Engraved in capitals, so shown in capitals: the customer
                // should see what they are getting, not a tidier version of
                // it.
                className="text-lg uppercase"
                onChange={event => setValues(v => ({ ...v, [field.label]: event.target.value }))}
              />
            </div>
          ) : (
            <div key={field.label} className="flex flex-col gap-0.5">
              <span className="text-subtle-foreground text-xs">{field.label}</span>
              <span className="text-foreground text-lg leading-snug break-words">
                {field.value}
              </span>
            </div>
          ),
        )}

        {colours.length > 0 && editable ? (
          <div className="flex flex-col gap-1.5">
            <span className="text-subtle-foreground text-xs">Colour</span>
            <div className="flex flex-wrap gap-2">
              {colours.map(option => (
                <button
                  key={option.name}
                  type="button"
                  onClick={() => setColour(option.name)}
                  aria-pressed={colour === option.name}
                  aria-label={option.name}
                  title={option.name}
                  className={cn(
                    'size-8 rounded-full border-2 transition',
                    colour === option.name
                      ? 'border-foreground scale-110'
                      : 'border-border hover:border-foreground/40',
                  )}
                  style={{ backgroundColor: option.hex }}
                />
              ))}
            </div>
            <span className="text-muted-foreground text-xs">{colour}</span>
          </div>
        ) : item.colour ? (
          <div className="flex flex-col gap-1">
            <span className="text-subtle-foreground text-xs">Colour</span>
            <span className="flex items-center gap-2">
              {item.colour_hex ? (
                <span
                  aria-hidden
                  className="border-border size-4 rounded-full border"
                  style={{ backgroundColor: item.colour_hex }}
                />
              ) : null}
              <span className="text-foreground">{item.colour}</span>
            </span>
          </div>
        ) : null}
      </div>

      {error ? (
        <p role="alert" className="bg-danger-subtle text-danger rounded-md px-3 py-2 text-sm">
          {error}
        </p>
      ) : null}

      {editable && dirty ? (
        <Button onClick={() => void save()} disabled={saving} className="w-full">
          {saving ? 'Saving…' : 'Save these changes'}
        </Button>
      ) : null}

      <div className="bg-surface-muted h-64 w-full overflow-hidden rounded-lg">
        {ready ? (
          <JobModelViewer
            key={modelVersion}
            modelUrl={`/api/p/${encodeURIComponent(token)}/items/${encodeURIComponent(item.job_id)}/model?v=${modelVersion}`}
            showPlate={false}
            captureName={`${item.job_number}.png`}
          />
        ) : (
          <ViewerPlaceholder
            text={rebuilding ? 'Rebuilding your preview…' : 'Building your preview…'}
          />
        )}
      </div>

      {ready ? (
        <Button
          variant="secondary"
          className="w-full"
          onClick={() => {
            void import('@/components/production/job-model-viewer').then(m =>
              m.downloadViewerImage(`${item.job_number}.png`),
            )
          }}
        >
          Save this picture
        </Button>
      ) : null}
    </section>
  )
}

/**
 * Follows the model: whether one exists, and whether it is still the old one.
 *
 * WATCHES THE MODEL'S ID, not merely whether a file answers. A re-render mints
 * a new file rather than overwriting the old one, so the id is an exact
 * signal - and without it the obvious implementation is wrong in the one case
 * that matters: after a save the previous model is still there, answers
 * immediately, and the customer is shown the colour they just changed away
 * from, which reads as the save having failed.
 *
 * Gives up after a few minutes. A render that has not landed by then has
 * failed, and a spinner that never stops is a worse answer than a still
 * picture of nothing.
 */
function useModel(token: string, item: PersonalisationItem, saves: number) {
  const [version, setVersion] = useState(item.model_version)
  const [waiting, setWaiting] = useState(false)

  useEffect(() => {
    if (saves === 0) return
    // A save means whatever is on screen is now out of date.
    setWaiting(true)
  }, [saves])

  useEffect(() => {
    if (!waiting) return
    let cancelled = false
    let attempts = 0
    const url = `/api/p/${encodeURIComponent(token)}/items/${encodeURIComponent(item.job_id)}`

    const poll = setInterval(() => {
      attempts += 1
      if (attempts > 40) {
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
    }, 4000)

    return () => {
      cancelled = true
      clearInterval(poll)
    }
  }, [waiting, token, item.job_id, version])

  return { version, rebuilding: waiting, ready: Boolean(version) && !waiting }
}

function ViewerPlaceholder({ text }: { text: string }): JSX.Element {
  return (
    <div className="text-muted-foreground flex h-full w-full items-center justify-center text-sm">
      {text}
    </div>
  )
}
