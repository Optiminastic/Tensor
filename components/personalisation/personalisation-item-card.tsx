'use client'

import dynamic from 'next/dynamic'
import { type JSX, useEffect, useState } from 'react'

import { Button } from '@/components/ui/button'
import type { PersonalisationItem } from '@/lib/validators/personalisation'

// Lazy and client-only, like every other viewer here: three.js is a large
// bundle and this page is opened on a phone, often on mobile data.
const JobModelViewer = dynamic(
  () => import('@/components/production/job-model-viewer').then(m => m.JobModelViewer),
  { ssr: false, loading: () => <ViewerPlaceholder text="Loading preview…" /> },
)

interface PersonalisationItemCardProps {
  token: string
  item: PersonalisationItem
}

/**
 * One thing the customer ordered: what it says, and what it will look like.
 *
 * THE WORDS COME FIRST AND THE MODEL SECOND. The preview is 20-45 seconds
 * behind the link, and the spelling is what they came to check - putting a
 * loading viewer above it would hide the only part that is ready.
 */
export function PersonalisationItemCard({
  token,
  item,
}: PersonalisationItemCardProps): JSX.Element {
  const ready = useModelReady(token, item)

  return (
    <section className="border-border/70 flex flex-col gap-4 rounded-xl border p-4">
      <header className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-foreground font-medium">{item.product_name}</h2>
        {item.quantity > 1 ? (
          <span className="text-subtle-foreground text-xs">× {item.quantity}</span>
        ) : null}
      </header>

      <dl className="flex flex-col gap-2">
        {item.fields.map(field => (
          <div key={field.label} className="flex flex-col gap-0.5">
            <dt className="text-subtle-foreground text-xs">{field.label}</dt>
            {/* Large and plain. The whole purpose of this page is that these
                few words are read carefully. */}
            <dd className="text-foreground text-lg leading-snug break-words">{field.value}</dd>
          </div>
        ))}
        {item.colour ? (
          <div className="flex flex-col gap-1">
            <dt className="text-subtle-foreground text-xs">Colour</dt>
            <dd className="flex items-center gap-2">
              {item.colour_hex ? (
                <span
                  aria-hidden
                  className="border-border size-4 rounded-full border"
                  style={{ backgroundColor: item.colour_hex }}
                />
              ) : null}
              <span className="text-foreground">{item.colour}</span>
            </dd>
          </div>
        ) : null}
      </dl>

      <div className="bg-surface-muted h-64 w-full overflow-hidden rounded-lg">
        {ready ? (
          <JobModelViewer
            modelUrl={`/api/p/${encodeURIComponent(token)}/items/${encodeURIComponent(item.job_id)}/model`}
            showPlate={false}
            captureName={`${item.job_number}.png`}
          />
        ) : (
          <ViewerPlaceholder text="Building your preview…" />
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
 * Polls until the model exists.
 *
 * The link is sent the moment the order arrives and the render follows 20-45
 * seconds later, so the first answer is almost always "not yet". Polling the
 * model itself rather than re-reading the whole order: one HEAD-shaped request
 * that answers exactly the question being asked.
 *
 * Gives up after a few minutes. A render that has not landed by then has
 * failed, and a spinner that never stops is a worse answer than a still
 * picture of nothing.
 */
function useModelReady(token: string, item: PersonalisationItem): boolean {
  const [ready, setReady] = useState(item.model_ready)

  useEffect(() => {
    if (ready) return
    let cancelled = false
    let attempts = 0
    const url = `/api/p/${encodeURIComponent(token)}/items/${encodeURIComponent(item.job_id)}/model`

    const poll = setInterval(() => {
      attempts += 1
      if (attempts > 40) {
        clearInterval(poll)
        return
      }
      void fetch(url, { method: 'GET', cache: 'no-store' })
        .then(response => {
          if (!cancelled && response.ok) {
            setReady(true)
            clearInterval(poll)
          }
        })
        .catch(() => undefined)
    }, 5000)

    return () => {
      cancelled = true
      clearInterval(poll)
    }
  }, [ready, token, item.job_id])

  return ready
}

function ViewerPlaceholder({ text }: { text: string }): JSX.Element {
  return (
    <div className="text-muted-foreground flex h-full w-full items-center justify-center text-sm">
      {text}
    </div>
  )
}
