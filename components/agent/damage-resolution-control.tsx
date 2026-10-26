'use client'

import { type JSX, useState } from 'react'

import {
  bookDamagePickupAction,
  confirmDamagePaymentAction,
  resolveDamageReportAction,
} from '@/app/dashboard/[brand]/agent/damaged-products/actions'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import type {
  DamageFile,
  DamageReport,
  DamageResolutionKind,
  DamageReverseState,
  DamageStage,
} from '@/lib/validators/whatsapp-damage'

interface DamageResolutionControlProps {
  brand: string
  report: DamageReport
  canResolve: boolean
  /** The report's timeline, so the progress line can tell the truth. */
  stages: DamageStage[]
  /** The customer's payment screenshot, shown beside the confirm button. */
  paymentProof: DamageFile | null
  onChanged: () => void
}

type Choice = Exclude<DamageResolutionKind, ''>

/** What each outcome commits the shop to, said before it is chosen. */
const CHOICES: { id: Choice; label: string; detail: string }[] = [
  {
    id: 'reprint',
    label: 'Re-print',
    detail: 'We make it again and send it. The customer pays nothing and returns nothing.',
  },
  {
    id: 'reverse',
    label: 'Reverse pickup',
    detail:
      'We message the customer asking for ₹100 and the payment QR, for the leg to our warehouse. ' +
      'We repair it and pay the leg home.',
  },
  {
    id: 'closed',
    label: 'Closed — sorted with the customer',
    detail:
      'Nothing is made, sent or collected. Your note is the only record of what was agreed, ' +
      'so it is required.',
  },
]

/**
 * How far the reverse negotiation has got, in words for somebody reading a
 * board — and, where somebody has to act, whose move it is.
 *
 * There is no `agreed` here any more. The ask is one message now, so paying
 * IS agreeing and nothing sits between being asked and the money arriving.
 */
const REVERSE_PROGRESS: Record<DamageReverseState, string> = {
  '': '',
  offered: 'Asked for ₹100 — waiting for the customer to pay',
  payment_claimed: 'The customer sent a screenshot — somebody needs to check it',
  paid: 'Payment confirmed — the pickup still needs booking',
  pickup_booked: 'Pickup booked. The courier will collect it.',
}

/**
 * Deciding what happens to a damaged parcel, and then carrying the reverse
 * route out.
 *
 * SEPARATE from the status control beside it, and not the same question. The
 * status says how far along the report is; this says what the shop is actually
 * doing about it, and choosing it messages the customer.
 *
 * DECIDED ONCE. The backend compares-and-sets on an empty resolution, so two
 * people on the same board cannot both decide and double-message the customer.
 * Once decided this shows what was chosen rather than offering the choice
 * again — a dropdown that silently fails is worse than no dropdown.
 *
 * THE REVERSE ROUTE KEEPS GOING after the decision, which is why this control
 * does not simply go quiet once something is chosen: a reverse runs over days
 * and needs a person twice more, and those two acts belong beside the decision
 * that started them rather than somewhere else on the page.
 */
export function DamageResolutionControl({
  brand,
  report,
  canResolve,
  stages,
  paymentProof,
  onChanged,
}: DamageResolutionControlProps): JSX.Element {
  const decided = report.resolution_kind !== ''

  if (decided) {
    return (
      <Decided
        brand={brand}
        report={report}
        canResolve={canResolve}
        stages={stages}
        paymentProof={paymentProof}
        onChanged={onChanged}
      />
    )
  }
  if (!canResolve) {
    return (
      <section className="flex flex-col gap-2">
        <Heading />
        <p className="text-muted-foreground text-sm">
          Not decided yet. Ask an admin or customer support to choose.
        </p>
      </section>
    )
  }
  return <Choose brand={brand} report={report} onChanged={onChanged} />
}

/** The dropdown, the note and Submit: the decision itself. */
function Choose({
  brand,
  report,
  onChanged,
}: {
  brand: string
  report: DamageReport
  onChanged: () => void
}): JSX.Element {
  const [choice, setChoice] = useState<Choice | null>(null)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [untold, setUntold] = useState(false)

  // Closing a report IS the note. The other two leave a waybill and a print
  // job behind them to say what happened; this one leaves a sentence, and an
  // empty one means the shop has no record of what it agreed with a customer
  // who complained. The backend refuses it too — this only saves the trip.
  const noteRequired = choice === 'closed'
  const noteMissing = noteRequired && note.trim() === ''

  async function submit(): Promise<void> {
    if (!choice || noteMissing) return
    setSaving(true)
    setError(null)
    setUntold(false)
    const result = await resolveDamageReportAction({ brand, id: report.id, kind: choice, note })
    setSaving(false)
    if (!result.ok) {
      setError(result.error ?? 'Could not record that.')
      return
    }
    // The decision stands whether or not the customer heard about it, so this
    // is a notice rather than an error - and it has to be said, or support
    // believes somebody was told who was not. Closing tells them nothing by
    // design, so it is not a surprise there.
    if (choice !== 'closed' && !result.data?.message_sent) setUntold(true)
    onChanged()
  }

  return (
    <section className="flex flex-col gap-3">
      <Heading />
      {/* A NATIVE <select>, not the React Aria one used elsewhere.
          This control lives inside a Sheet, and React Aria renders its
          popover through a portal OUTSIDE the sheet's DOM - so the sheet's
          own overlay swallows every click on the menu. It opens, it
          highlights, and nothing is ever chosen. A native select has no
          portal and no overlay to fight with, and the browser's own menu is
          the better control on a phone anyway. */}
      <Select
        aria-label="What to do about this damaged order"
        value={choice ?? ''}
        onChange={event => setChoice((event.target.value || null) as Choice | null)}
        className="w-72"
      >
        <option value="">Choose…</option>
        {CHOICES.map(c => (
          <option key={c.id} value={c.id}>
            {c.label}
          </option>
        ))}
      </Select>

      {/* What it commits the shop to, shown BEFORE the button rather than
          learned afterwards: one of these costs a reprint, one asks a
          customer for money, and one quietly ends the report. */}
      {choice ? (
        <p className="text-muted-foreground text-sm text-pretty">
          {CHOICES.find(c => c.id === choice)?.detail}
        </p>
      ) : null}

      <Textarea
        rows={3}
        value={note}
        onChange={event => setNote(event.target.value)}
        placeholder={
          noteRequired
            ? 'What was done — the screw posted on, the mark that buffed out…'
            : 'Why — what the photos show, what you told the customer…'
        }
        aria-label={noteRequired ? 'What was done (required)' : 'Note'}
        aria-required={noteRequired}
      />
      {/* Said plainly: it is for the next person reading this report, not for
          the customer, who gets the fixed message. */}
      <p className="text-subtle-foreground text-xs">
        {noteRequired
          ? 'Required for a closed report, and internal — the customer is not messaged.'
          : 'This note stays internal. The customer gets our standard message.'}
      </p>

      {error ? (
        <p role="alert" className="text-danger text-sm">
          {error}
        </p>
      ) : null}
      {untold ? (
        <p role="status" className="text-warning text-sm text-pretty">
          Recorded, but we could not message the customer — WhatsApp only allows a reply within 24
          hours of their last message. Reach them another way.
        </p>
      ) : null}

      <div>
        <Button onClick={submit} disabled={!choice || noteMissing || saving}>
          {saving ? 'Saving…' : 'Submit'}
        </Button>
      </div>
    </section>
  )
}

/**
 * What was decided, how far it has got, and the next thing to do about it.
 *
 * The buttons appear only on the reverse route and only in the one state that
 * allows them. A disabled button on every row would teach people to click
 * hopefully; showing the one real move keeps the drawer honest about whose
 * turn it is.
 */
function Decided({
  brand,
  report,
  canResolve,
  stages,
  paymentProof,
  onChanged,
}: {
  brand: string
  report: DamageReport
  canResolve: boolean
  stages: DamageStage[]
  paymentProof: DamageFile | null
  onChanged: () => void
}): JSX.Element {
  const chosen = CHOICES.find(c => c.id === report.resolution_kind)
  const progress = REVERSE_PROGRESS[report.reverse_state]

  // THE REPORT SAYS "ASKED" EVEN WHEN THE ASK NEVER LEFT. The decision is
  // stored before the message is attempted and stands either way, so a
  // WhatsApp refusal - outside its 24-hour reply window, usually - leaves a
  // report reading `offered` with nobody on the other end. Saying "waiting
  // for the customer to pay" there would have support waiting on a customer
  // who was never asked, so the timeline's verdict wins.
  const askFailed =
    report.reverse_state === 'offered' &&
    stages.some(s => s.stage === 'customer_told' && s.state === 'failed')

  return (
    <section className="flex flex-col gap-2">
      <Heading />
      <p className="text-sm font-medium">{chosen?.label ?? report.resolution_kind}</p>
      {askFailed ? (
        <p role="alert" className="text-danger text-sm text-pretty">
          We could not send the ₹100 request — the customer has not been asked. WhatsApp only allows
          a reply within 24 hours of their last message, so reach them another way before waiting on
          a payment.
        </p>
      ) : progress ? (
        <p className="text-muted-foreground text-sm">{progress}</p>
      ) : null}
      {report.resolution_note ? (
        <p className="text-muted-foreground text-sm text-pretty">{report.resolution_note}</p>
      ) : null}
      {report.resolution_kind === 'reverse' && canResolve ? (
        <ReverseActions
          brand={brand}
          report={report}
          paymentProof={paymentProof}
          onChanged={onChanged}
        />
      ) : null}
    </section>
  )
}

/**
 * The two human steps the reverse route still needs.
 *
 * THEY ARE TWO CLICKS, and the second is the reason. Confirming a payment is
 * reversible — somebody who ticked the wrong row can say so. Booking is not:
 * it costs a courier and puts a van outside somebody's house. Collapsing them
 * would make the expensive act a side effect of the cheap one, on a board
 * where the rows look alike.
 */
function ReverseActions({
  brand,
  report,
  paymentProof,
  onChanged,
}: {
  brand: string
  report: DamageReport
  paymentProof: DamageFile | null
  onChanged: () => void
}): JSX.Element | null {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [untold, setUntold] = useState(false)
  // The booking asks twice. Not a modal: a second press of a button that has
  // changed its words, so the thing being confirmed is the thing in front of
  // you rather than a sentence in a dialog somebody dismisses by habit.
  const [armed, setArmed] = useState(false)

  const state = report.reverse_state
  const awaitingMoney = state === 'offered' || state === 'payment_claimed'
  const awaitingVan = state === 'paid'
  if (!awaitingMoney && !awaitingVan) return null

  async function confirmPayment(): Promise<void> {
    setBusy(true)
    setError(null)
    const result = await confirmDamagePaymentAction({ brand, id: report.id })
    setBusy(false)
    if (!result.ok) {
      setError(result.error ?? 'Could not record the payment.')
      return
    }
    onChanged()
  }

  async function bookPickup(): Promise<void> {
    setBusy(true)
    setError(null)
    setUntold(false)
    const result = await bookDamagePickupAction({ brand, id: report.id })
    setBusy(false)
    setArmed(false)
    if (!result.ok) {
      setError(result.error ?? 'Could not book the pickup.')
      return
    }
    // The van is coming either way; a message that would not send must not
    // read as a booking that failed.
    if (!result.data?.message_sent) setUntold(true)
    onChanged()
  }

  return (
    <div className="border-border mt-1 flex flex-col gap-2 border-t pt-3">
      {awaitingMoney ? (
        <>
          <p className="text-subtle-foreground text-xs text-pretty">
            Check the ₹100 against the bank, not only the screenshot — a screenshot is a picture of
            a screen.
          </p>
          <div>
            <Button variant="soft-success" size="sm" onClick={confirmPayment} disabled={busy}>
              {busy ? 'Recording…' : 'Confirm ₹100 received'}
            </Button>
          </div>
        </>
      ) : null}

      {awaitingVan ? (
        <>
          <p className="text-subtle-foreground text-xs text-pretty">
            This books a real courier to the customer&rsquo;s address and bills the shop. The only
            way back is cancelling the waybill at Delhivery.
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant={armed ? 'danger' : 'secondary'}
              size="sm"
              onClick={armed ? bookPickup : () => setArmed(true)}
              disabled={busy}
            >
              {busy ? 'Booking…' : armed ? 'Yes — send the courier' : 'Book the pickup'}
            </Button>
            {armed && !busy ? (
              <Button variant="ghost" size="sm" onClick={() => setArmed(false)}>
                Cancel
              </Button>
            ) : null}
          </div>
        </>
      ) : null}

      {error ? (
        <p role="alert" className="text-danger text-sm text-pretty">
          {error}
        </p>
      ) : null}
      {untold ? (
        <p role="status" className="text-warning text-sm text-pretty">
          Booked, but we could not tell the customer — WhatsApp only allows a reply within 24 hours
          of their last message. Let them know the courier is coming.
        </p>
      ) : null}
    </div>
  )
}

/**
 * The screenshot the customer sent, small and clickable.
 *
 * SMALL ON PURPOSE. It is a prompt to go and check the bank, not evidence to
 * study in the drawer — a full-width receipt would invite somebody to confirm
 * a payment on the strength of a picture anyone can edit. Clicking opens it
 * full size for the person who does want a closer look.
 */
function PaymentProof({
  brand,
  reportId,
  file,
}: {
  brand: string
  reportId: string
  file: DamageFile
}): JSX.Element {
  const href =
    `/api/damage/${encodeURIComponent(brand)}/${encodeURIComponent(reportId)}` +
    `/files/${encodeURIComponent(file.id)}`
  return (
    <figure className="flex items-start gap-3">
      <a href={href} target="_blank" rel="noopener noreferrer" className="shrink-0">
        {/* Plain <img>: a customer upload of unknown dimensions behind an
            authenticated route, which next/image can neither size ahead of
            time nor fetch through its optimiser. */}
        <img
          src={href}
          alt="Payment screenshot the customer sent"
          loading="lazy"
          className="border-border size-20 rounded-lg border object-cover"
        />
      </a>
      <figcaption className="text-subtle-foreground text-xs text-pretty">
        The customer sent this as proof of payment. Open it full size, then check the money actually
        arrived.
      </figcaption>
    </figure>
  )
}

function Heading(): JSX.Element {
  return (
    <h3 className="text-subtle-foreground text-[11px] font-medium tracking-wide uppercase">
      What we are doing
    </h3>
  )
}
