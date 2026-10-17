'use client'

import { CheckCircle2 } from 'lucide-react'
import { type JSX, useState } from 'react'

import { DamageUploadList } from '@/components/damage/damage-upload-list'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useDamageUploads } from '@/hooks/use-damage-uploads'
import type { DamageForm } from '@/lib/validators/damage-form'

interface DamageReportFormProps {
  token: string
  form: DamageForm
}

/**
 * The customer's damage report.
 *
 * BUILT FOR A PHONE HELD IN ONE HAND, because that is where a WhatsApp link
 * is opened. One column at every width, nothing smaller than 44px to tap,
 * and two questions on the whole page: which order, and what does it look
 * like. Everything else - who they are, which brand, when they ordered - is
 * already known from the link they came in on.
 *
 * Files go up AS THEY ARE PICKED rather than on submit. Somebody choosing
 * four photographs and a video has a two-minute wait either way; doing it
 * while they type the order number means the Send button is usually instant,
 * and a dropped connection costs one file instead of all five.
 */
export function DamageReportForm({ token, form }: DamageReportFormProps): JSX.Element {
  const [orderID, setOrderID] = useState(form.order_number)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(form.submitted)
  const [error, setError] = useState<string | null>(null)

  const uploads = useDamageUploads({
    token,
    existing: form.files,
    maxFiles: form.max_files,
    maxFileMB: form.max_file_mb,
  })

  const busy = uploads.rows.some(row => row.state === 'uploading')
  const ready = orderID.trim() !== '' && uploads.stored > 0 && !busy

  async function submit(): Promise<void> {
    setSending(true)
    setError(null)
    try {
      const response = await fetch(`/api/d/${encodeURIComponent(token)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderID.trim() }),
      })
      if (response.ok) {
        setSent(true)
        return
      }
      // Tensor-Core's own sentence names the thing to fix.
      const body: unknown = await response.json().catch(() => null)
      const detail =
        body && typeof body === 'object' && 'detail' in body
          ? (body as { detail?: unknown }).detail
          : null
      setError(typeof detail === 'string' ? detail : 'That did not send. Please try again.')
    } catch {
      setError('That did not send. Check your connection and try again.')
    } finally {
      setSending(false)
    }
  }

  if (sent) {
    return (
      <main className="mx-auto flex min-h-dvh w-full max-w-lg flex-col justify-center gap-4 px-5 py-16">
        <CheckCircle2 className="text-success size-8" aria-hidden />
        <h1 className="text-display text-2xl">Thank you — we have it</h1>
        <p className="text-muted-foreground text-pretty">
          Our team will look at your photos and reply to you on WhatsApp. You do not need to do
          anything else.
        </p>
        {/* The link stays open for its full 24 hours, so somebody who finds
            another photograph later can add it to this same report rather
            than start again. */}
        <button
          type="button"
          onClick={() => setSent(false)}
          className="text-accent w-fit text-sm underline-offset-4 hover:underline"
        >
          Add another photo or video
        </button>
      </main>
    )
  }

  return (
    <main className="mx-auto flex w-full max-w-lg flex-col gap-7 px-5 py-10">
      <header className="flex flex-col gap-2">
        <h1 className="text-display text-2xl">Report damage</h1>
        <p className="text-muted-foreground text-sm text-pretty">
          We are sorry your order arrived like this. Tell us which order it is and show us the
          damage, and our team will sort it out on WhatsApp.
        </p>
      </header>

      <div className="flex flex-col gap-2">
        <Label htmlFor="order-id">Your order ID</Label>
        <Input
          id="order-id"
          value={orderID}
          inputMode="text"
          autoComplete="off"
          placeholder="e.g. T3DPS-115766"
          onChange={event => setOrderID(event.target.value)}
        />
        <p className="text-subtle-foreground text-xs text-pretty">
          It is at the top of your order confirmation email. Either form works —{' '}
          <span className="font-mono">115766</span> or{' '}
          <span className="font-mono">T3DPS-115766</span>.
        </p>
      </div>

      <div className="flex flex-col gap-2">
        <Label>Photos or video of the damage</Label>
        <p className="text-subtle-foreground text-xs text-pretty">
          Please include the packaging as well as the product — it tells us whether it happened in
          transit.
        </p>
        <DamageUploadList
          rows={uploads.rows}
          maxFiles={form.max_files}
          maxFileMB={form.max_file_mb}
          onPick={uploads.add}
          onRetry={uploads.retry}
        />
      </div>

      {error ? (
        <p role="alert" className="text-danger text-sm text-pretty">
          {error}
        </p>
      ) : null}

      <div className="flex flex-col gap-2">
        <Button size="lg" disabled={!ready || sending} onClick={submit}>
          {sending ? 'Sending…' : 'Send to the shop'}
        </Button>
        {/* Says WHY it is disabled. A greyed button with no explanation is
            the commonest way a form like this is abandoned. */}
        {!ready && !sending ? (
          <p className="text-subtle-foreground text-center text-xs">
            {busy
              ? 'Waiting for your files to finish uploading…'
              : uploads.stored === 0
                ? 'Add at least one photo or video.'
                : 'Enter your order ID.'}
          </p>
        ) : null}
      </div>
    </main>
  )
}
