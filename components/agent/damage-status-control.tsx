'use client'

import { type JSX, useState } from 'react'

import { updateDamageReportAction } from '@/app/dashboard/[brand]/agent/damaged-products/actions'
import { DAMAGE_STATUS_CONFIG } from '@/components/agent/damage-status-config'
import { Select, SelectItem } from '@/components/base/select/select'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import type { DamageReport, DamageStatus } from '@/lib/validators/whatsapp-damage'

interface DamageStatusControlProps {
  brand: string
  report: DamageReport
  canUpdate: boolean
  onChanged: () => void
}

const STATUSES: DamageStatus[] = ['new', 'in_review', 'resolved']

/**
 * Moving a report along, and writing down what was done about it.
 *
 * The status and the note save together in one call, because they are one
 * thought: "resolved" with no account of how is a row that answers nothing in
 * three months' time.
 */
export function DamageStatusControl({
  brand,
  report,
  canUpdate,
  onChanged,
}: DamageStatusControlProps): JSX.Element {
  const [status, setStatus] = useState<DamageStatus>(report.status)
  const [note, setNote] = useState(report.resolution_note)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const dirty = status !== report.status || note !== report.resolution_note

  async function save(): Promise<void> {
    setSaving(true)
    setError(null)
    const result = await updateDamageReportAction({
      brand,
      id: report.id,
      status,
      resolutionNote: note,
    })
    setSaving(false)
    if (!result.ok) {
      setError(result.error ?? 'Could not save that.')
      return
    }
    onChanged()
  }

  if (!canUpdate) {
    return (
      <section className="flex flex-col gap-2">
        <h3 className="text-subtle-foreground text-[11px] font-medium tracking-wide uppercase">
          Resolution
        </h3>
        <p className="text-muted-foreground text-sm text-pretty">
          {report.resolution_note || 'Nothing recorded yet.'}
        </p>
      </section>
    )
  }

  return (
    <section className="flex flex-col gap-3">
      <h3 className="text-subtle-foreground text-[11px] font-medium tracking-wide uppercase">
        Resolution
      </h3>
      <Select
        aria-label="Damage report status"
        size="sm"
        selectedKey={status}
        onSelectionChange={key => setStatus(String(key) as DamageStatus)}
        className="w-48"
      >
        {STATUSES.map(value => (
          <SelectItem key={value} id={value}>
            {DAMAGE_STATUS_CONFIG[value].label}
          </SelectItem>
        ))}
      </Select>
      <Textarea
        rows={3}
        value={note}
        onChange={event => setNote(event.target.value)}
        placeholder="What was done about it — replacement sent, refunded, waiting on the customer…"
        aria-label="Resolution note"
      />
      {error ? (
        <p role="alert" className="text-danger text-sm">
          {error}
        </p>
      ) : null}
      <div>
        <Button onClick={save} disabled={!dirty || saving}>
          {saving ? 'Saving…' : 'Save'}
        </Button>
      </div>
    </section>
  )
}
