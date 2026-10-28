'use client'

import { AlertTriangle, Check, Mail, Send } from 'lucide-react'
import { type JSX, useState } from 'react'

import {
  saveAccountsReportAction,
  sendAccountsReportAction,
} from '@/app/dashboard/settings/accounts-report/actions'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import type { AccountsReport } from '@/lib/validators/accounts-report'

interface AccountsReportFormProps {
  brand: string
  initial: AccountsReport
}

/**
 * Who the daily sales register goes to, and what it asserts about tax.
 *
 * ONE TEXTAREA PER FIELD, not a chip editor. These lists are pasted from an
 * email or a spreadsheet far more often than they are typed one address at a
 * time, and the backend already splits on commas, semicolons and newlines - so
 * the most useful box is the one you can paste a whole line into.
 *
 * SENDING ASKS TWICE. It mails a real accountant and closes the day's window,
 * so the scheduled run will not send it again - a mis-click is not recoverable
 * by pressing something else.
 */
export function AccountsReportForm({ brand, initial }: AccountsReportFormProps): JSX.Element {
  const [report, setReport] = useState(initial)
  const [enabled, setEnabled] = useState(initial.enabled)
  const [to, setTo] = useState(initial.to.join(', '))
  const [cc, setCc] = useState(initial.cc.join(', '))
  const [bcc, setBcc] = useState(initial.bcc.join(', '))
  const [rate, setRate] = useState(String(initial.gst_percent))
  const [state, setState] = useState(initial.seller_state)

  const [saving, setSaving] = useState(false)
  const [sending, setSending] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)

  async function save(): Promise<void> {
    setSaving(true)
    setError(null)
    setNotice(null)
    const result = await saveAccountsReportAction({
      brand,
      enabled,
      to: [to],
      cc: [cc],
      bcc: [bcc],
      gst_percent: Number(rate),
      seller_state: state,
    })
    setSaving(false)
    if (!result.ok || !result.data) {
      setError(result.error ?? 'Could not save.')
      return
    }
    setReport(result.data)
    // Re-rendered from what the server stored, not from what was typed: the
    // backend de-duplicates and tidies, and showing the typed version would
    // hide that it did.
    setTo(result.data.to.join(', '))
    setCc(result.data.cc.join(', '))
    setBcc(result.data.bcc.join(', '))
    setNotice('Saved.')
  }

  async function send(): Promise<void> {
    setSending(true)
    setError(null)
    setNotice(null)
    const result = await sendAccountsReportAction(brand)
    setSending(false)
    setConfirming(false)
    if (!result.ok || !result.data) {
      setError(result.error ?? 'The report could not be sent.')
      return
    }
    const sent = result.data
    setNotice(
      `Sent ${sent.filename} to ${sent.recipients} ${
        sent.recipients === 1 ? 'recipient' : 'recipients'
      } — ${sent.orders} ${sent.orders === 1 ? 'order' : 'orders'}, ${sent.rows} line ${
        sent.rows === 1 ? 'item' : 'items'
      }.`,
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {!report.mailbox_ready ? (
        <Card className="border-warning/40 bg-warning-subtle p-4">
          <p className="text-foreground flex items-start gap-2 text-sm text-pretty">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              This service has no mailbox configured, so nothing can be sent yet. Set{' '}
              <span className="font-mono text-xs">SMTP_HOST</span>,{' '}
              <span className="font-mono text-xs">SMTP_USERNAME</span>,{' '}
              <span className="font-mono text-xs">SMTP_PASSWORD</span> and{' '}
              <span className="font-mono text-xs">SMTP_FROM</span> on the accounts-report worker.
            </span>
          </p>
        </Card>
      ) : null}

      <Card className="flex flex-col gap-5 p-5">
        <div className="flex items-start justify-between gap-6">
          <div>
            <h2 className="text-foreground text-base font-medium">Send the register daily</h2>
            <p className="text-muted-foreground mt-1 max-w-prose text-sm text-pretty">
              One spreadsheet per day, covering <span className="font-medium">noon to noon</span>{' '}
              IST — the shop&apos;s own day, because the floor works past midnight and a calendar
              day would split one evening across two reports.
            </p>
          </div>
          <Switch checked={enabled} onCheckedChange={setEnabled} aria-label="Send daily" />
        </div>

        <Field
          id="to"
          label="To"
          hint="Required. Separate addresses with commas, semicolons or new lines."
          value={to}
          onChange={setTo}
        />
        <Field
          id="cc"
          label="Cc"
          hint="Optional. Everyone can see these."
          value={cc}
          onChange={setCc}
        />
        <Field
          id="bcc"
          label="Bcc"
          hint="Optional. Hidden from every other recipient."
          value={bcc}
          onChange={setBcc}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="rate">GST rate (%)</Label>
            <Input
              id="rate"
              value={rate}
              onChange={e => setRate(e.target.value)}
              className="w-32 font-mono tabular-nums"
              inputMode="decimal"
            />
            {/* The honest bit, and the reason this is editable at all. */}
            <p className="text-subtle-foreground max-w-prose text-xs text-pretty">
              Shopify reports no tax on this store — every line carries an 18% IGST line priced at
              zero, and the order total equals its subtotal. So the GST columns are{' '}
              <span className="font-medium">derived</span> from this rate, treating your prices as
              tax-inclusive. If prices are actually ex-GST, every figure will be wrong.
            </p>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="state">Seller state</Label>
            <Input
              id="state"
              value={state}
              onChange={e => setState(e.target.value)}
              className="w-56"
            />
            <p className="text-subtle-foreground max-w-prose text-xs text-pretty">
              A sale inside this state splits into CGST and SGST; one crossing a border is IGST.
              Compared against the shipping address, because place of supply is where the goods
              went.
            </p>
          </div>
        </div>

        <div className="border-border flex flex-wrap items-center gap-2 border-t pt-4">
          <Button onClick={() => void save()} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>

          {confirming ? (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-danger text-sm text-pretty">
                This emails the accountant now and closes today&apos;s window, so the scheduled run
                will not send it again.
              </span>
              <Button variant="danger" size="sm" onClick={() => void send()} disabled={sending}>
                {sending ? 'Sending…' : 'Send it'}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setConfirming(false)}
                disabled={sending}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button
              variant="secondary"
              onClick={() => setConfirming(true)}
              disabled={!report.mailbox_ready || report.to.length === 0}
              title={
                report.to.length === 0 ? 'Add a To address and save first' : 'Send today’s register'
              }
            >
              <Send className="size-3.5" aria-hidden />
              Send now
            </Button>
          )}
        </div>

        {error ? (
          <p role="alert" className="text-danger text-sm text-pretty">
            {error}
          </p>
        ) : null}
        {notice ? (
          <p className="text-success inline-flex items-center gap-1.5 text-sm text-pretty">
            <Check className="size-4" aria-hidden />
            {notice}
          </p>
        ) : null}
      </Card>

      <LastRun report={report} />
    </div>
  )
}

function Field({
  id,
  label,
  hint,
  value,
  onChange,
}: {
  id: string
  label: string
  hint: string
  value: string
  onChange: (next: string) => void
}): JSX.Element {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Textarea
        id={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={2}
        spellCheck={false}
        className="font-mono text-sm"
      />
      <p className="text-subtle-foreground text-xs">{hint}</p>
    </div>
  )
}

/**
 * What happened last time.
 *
 * ON SCREEN, NOT ONLY IN A LOG. A report that silently stops arriving is the
 * failure this whole feature is prone to, and nobody reads a worker's logs
 * until somebody complains.
 */
function LastRun({ report }: { report: AccountsReport }): JSX.Element {
  return (
    <Card className="flex flex-col gap-3 p-5">
      <h2 className="text-foreground text-base font-medium">Last run</h2>

      {report.last_error ? (
        <p className="text-danger text-sm text-pretty" role="alert">
          The last attempt failed: {report.last_error}
        </p>
      ) : null}

      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <Stat label="Last sent" value={formatWhen(report.last_sent_at)} />
        <Stat label="Day covered" value={formatDay(report.last_window_end)} />
        <Stat
          label="Line items in it"
          value={report.last_sent_at ? String(report.last_row_count) : '—'}
          mono
        />
        <Stat
          label="Sent from"
          value={report.mailbox_from || 'not configured'}
          icon={<Mail className="size-3.5" aria-hidden />}
        />
      </dl>

      <p className="text-subtle-foreground text-xs text-pretty">
        The next scheduled run covers {formatWhen(report.next_window_start)} to{' '}
        {formatWhen(report.next_window_end)}, and goes out shortly after it closes.
      </p>
    </Card>
  )
}

function Stat({
  label,
  value,
  mono,
  icon,
}: {
  label: string
  value: string
  mono?: boolean
  icon?: JSX.Element
}): JSX.Element {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-subtle-foreground text-xs">{label}</dt>
      <dd
        className={`text-foreground inline-flex items-center gap-1.5 ${
          mono ? 'font-mono tabular-nums' : ''
        }`}
      >
        {icon}
        {value}
      </dd>
    </div>
  )
}

function formatWhen(value: string): string {
  if (!value) return 'never'
  const when = new Date(value)
  if (Number.isNaN(when.getTime())) return '—'
  return when.toLocaleString(undefined, {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDay(value: string): string {
  if (!value) return 'never'
  const when = new Date(value)
  if (Number.isNaN(when.getTime())) return '—'
  return when.toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })
}
