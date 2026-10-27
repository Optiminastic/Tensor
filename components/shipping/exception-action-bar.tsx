'use client'

import { Check, RotateCw, Undo2 } from 'lucide-react'
import { type JSX, useState } from 'react'

import { actOnExceptionAction } from '@/app/dashboard/[brand]/shipping/exception-actions'
import { Button } from '@/components/ui/button'
import type { ExceptionAction, ShipmentException } from '@/lib/validators/shipment-exceptions'

interface ExceptionActionBarProps {
  brand: string
  exception: ShipmentException
  canAct: boolean
  asked?: string
  onAsked: (label: string) => void
}

/**
 * Delhivery's own buttons for this row.
 *
 * THE BUTTONS COME FROM THE ROW, NOT FROM US. Every exception carries a
 * `cta_list` naming exactly what Delhivery will accept for it, and the codes
 * differ by bucket. A fixed list here would offer buttons the courier refuses
 * and hide ones it would have taken - which is the same class of mistake as
 * classifying their status codes locally.
 *
 * RETURN ASKS TWICE. Re-attempting costs another van; returning gives up on
 * the parcel and starts it back to the warehouse, and the customer never gets
 * it. Those are not the same weight of decision and they do not get the same
 * single click.
 *
 * "ASKED", NEVER "DONE". Delhivery takes these out of band - the response
 * carries no parcel state - so the row says what was asked for and leaves the
 * outcome to Delhivery's own refresh.
 */
export function ExceptionActionBar({
  brand,
  exception,
  canAct,
  asked,
  onAsked,
}: ExceptionActionBarProps): JSX.Element {
  const [busy, setBusy] = useState(false)
  const [confirming, setConfirming] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function send(action: ExceptionAction): Promise<void> {
    setBusy(true)
    setError(null)
    const result = await actOnExceptionAction({
      brand,
      id: exception.id,
      code: action.code,
      bucket: exception.bucket,
    })
    setBusy(false)
    setConfirming(null)
    if (!result.ok) {
      setError(result.error ?? 'The courier would not take that.')
      return
    }
    onAsked(action.label)
  }

  if (!canAct) {
    return (
      <span className="text-subtle-foreground text-xs">You can see this but not act on it.</span>
    )
  }

  if (asked) {
    return (
      <div className="flex flex-col gap-0.5">
        <span className="text-success inline-flex items-center gap-1 text-xs">
          <Check className="size-3" aria-hidden />
          {asked}
        </span>
        <span className="text-subtle-foreground text-[11px] text-pretty">
          Sent to Delhivery. The tab changes on their refresh, not ours.
        </span>
      </div>
    )
  }

  if (exception.actions.length === 0) {
    // Meaningful, not a loading state: Delhivery offers nothing on this row.
    return (
      <span className="text-subtle-foreground text-xs text-pretty">
        Delhivery is not asking for anything here.
      </span>
    )
  }

  const pending = exception.actions.find(a => a.code === confirming)
  if (pending) {
    return (
      <div className="flex flex-col gap-1.5">
        <p className="text-danger max-w-[16rem] text-xs text-pretty">
          This gives up on the parcel. It starts back to the warehouse and the customer does not get
          it.
        </p>
        <div className="flex items-center gap-1.5">
          <Button variant="danger" size="sm" onClick={() => void send(pending)} disabled={busy}>
            {busy ? 'Asking…' : pending.label}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setConfirming(null)} disabled={busy}>
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-1.5">
        {exception.actions.map(action => {
          const giveUp = isReturn(action)
          return (
            <Button
              key={action.code}
              variant={giveUp ? 'soft-danger' : 'soft-success'}
              size="sm"
              disabled={busy}
              onClick={() => (giveUp ? setConfirming(action.code) : void send(action))}
            >
              {giveUp ? (
                <Undo2 className="size-3" aria-hidden />
              ) : (
                <RotateCw className="size-3" aria-hidden />
              )}
              {action.label}
            </Button>
          )
        })}
      </div>
      {error ? (
        <p role="alert" className="text-danger max-w-[18rem] text-xs text-pretty">
          {error}
        </p>
      ) : null}
    </div>
  )
}

/**
 * Whether this button gives up on the parcel.
 *
 * Matched on Delhivery's label rather than on the code, because the code for a
 * return differs by bucket while the word does not. A label this misses costs a
 * confirmation step, not a wrong action.
 */
function isReturn(action: ExceptionAction): boolean {
  return /return|rto/i.test(action.label) || action.code === 'CTA002'
}
