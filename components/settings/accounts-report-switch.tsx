'use client'

import { useRouter } from 'next/navigation'
import { type JSX, useState } from 'react'

import { saveAccountsReportAction } from '@/app/dashboard/settings/accounts-report/actions'
import { Switch } from '@/components/ui/switch'
import type { AccountsReport } from '@/lib/validators/accounts-report'

interface AccountsReportSwitchProps {
  brand: string
  report: AccountsReport
}

/**
 * Whether the register goes out at all, ON THE PAGE rather than inside the
 * settings dialog.
 *
 * It had been moved into that dialog along with the rest of the form, and the
 * first question asked of the new page was "where is the toggle?" - which is
 * the answer. This one switch decides whether anything is ever sent: the
 * worker's due-query opens with `WHERE enabled = true`, so with it off every
 * five-minute tick finds nothing, for ever, silently. That state has to be
 * readable without opening anything, and fixable in one click.
 *
 * It saves the rest of the settings unchanged, because there is one write
 * path for this record and inventing a second - a PATCH that touched only
 * this column - would be a second place for the recipient rules to drift.
 */
export function AccountsReportSwitch({ brand, report }: AccountsReportSwitchProps): JSX.Element {
  const router = useRouter()
  const [on, setOn] = useState(report.enabled)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const ready = report.to.length > 0

  async function choose(next: boolean): Promise<void> {
    const previous = on
    setOn(next)
    setBusy(true)
    setError(null)
    const result = await saveAccountsReportAction({
      brand,
      enabled: next,
      to: report.to,
      cc: report.cc,
      bcc: report.bcc,
      gst_percent: report.gst_percent,
      seller_state: report.seller_state,
    })
    setBusy(false)
    if (!result.ok) {
      // Put it back. A switch that reads ON while the register is off is the
      // exact failure this page exists to make visible.
      setOn(previous)
      setError(result.error ?? 'Could not change that setting.')
      return
    }
    router.refresh()
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <label className="flex items-center gap-2">
        <span className="text-sm font-medium whitespace-nowrap">
          {on ? 'Sending daily' : 'Not sending'}
        </span>
        <Switch
          checked={on}
          // Nothing can be sent with no recipient, and the backend refuses it
          // - so the switch says so rather than offering a save that fails.
          disabled={busy || (!ready && !on)}
          onCheckedChange={next => void choose(next)}
          aria-label="Send the register daily"
        />
      </label>
      {!ready && !on ? (
        <span className="text-muted-foreground text-xs">Add a To address first</span>
      ) : null}
      {error ? (
        <span role="alert" className="text-danger max-w-64 text-right text-xs text-pretty">
          {error}
        </span>
      ) : null}
    </div>
  )
}
