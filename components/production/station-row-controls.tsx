'use client'

import { AlertTriangle, ArrowRight } from 'lucide-react'
import type { JSX } from 'react'

import { Button } from '@/components/ui/button'
import type { StationIssue, StationIssuesByJob } from '@/lib/validators/station-issues'

/**
 * The arrow, the tick box and the bar above the table.
 *
 * Shared so all four stations look and behave identically. A bench worker
 * moves between these tabs all day; the control that advances work should not
 * change shape when the columns do.
 */

interface RowCheckboxProps {
  checked: boolean
  onChange: () => void
  label: string
}

/** The per-row tick box. Native, so it is keyboard-reachable for free. */
export function RowCheckbox({ checked, onChange, label }: RowCheckboxProps): JSX.Element {
  return (
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      aria-label={label}
      className="border-border-strong text-accent focus-visible:ring-accent size-4 cursor-pointer rounded focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:outline-none"
    />
  )
}

interface AdvanceArrowProps {
  onClick: () => void
  disabled: boolean
  /** Named for a screen reader: "Move T3DPS-1 on to Finishing". */
  label: string
}

/**
 * The arrow that moves one job on.
 *
 * AN ARROW, NOT A WORD, because it is pressed hundreds of times a day on a
 * screen somebody is standing in front of with a part in their other hand. It
 * carries an aria-label naming the job and the next station, so what is
 * terse to look at is not terse to a screen reader.
 */
export function AdvanceArrow({ onClick, disabled, label }: AdvanceArrowProps): JSX.Element {
  return (
    <Button
      variant="soft-success"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
    >
      <ArrowRight className="size-4" aria-hidden />
    </Button>
  )
}

interface SelectionBarProps {
  count: number
  nextStation: string
  busy: boolean
  onAdvance: () => void
  onClear: () => void
}

/**
 * What appears once anything is ticked.
 *
 * It names the DESTINATION rather than saying "move selected", because the
 * whole risk of a bulk action is somebody not knowing where it goes.
 */
export function SelectionBar({
  count,
  nextStation,
  busy,
  onAdvance,
  onClear,
}: SelectionBarProps): JSX.Element | null {
  if (count === 0) return null
  return (
    <div className="border-accent/30 bg-accent-subtle flex flex-wrap items-center gap-3 rounded-md border px-4 py-2.5">
      <span className="text-foreground text-sm">
        <span className="font-mono tabular-nums">{count}</span> {count === 1 ? 'job' : 'jobs'}{' '}
        selected
      </span>
      <Button size="sm" onClick={onAdvance} disabled={busy}>
        {busy ? 'Moving…' : `Move to ${nextStation}`}
        <ArrowRight className="size-3.5" aria-hidden />
      </Button>
      <Button variant="ghost" size="sm" onClick={onClear} disabled={busy}>
        Clear
      </Button>
    </div>
  )
}

/**
 * The classes a row carries while it is leaving.
 *
 * TRANSLATE AND FADE, NOT HEIGHT. Collapsing the row's height would reflow
 * every row beneath it mid-animation, which reads as the whole table twitching
 * rather than one row departing. Pointer events are turned off so a second
 * click cannot land on something already on its way out.
 */
export function leavingClasses(isLeaving: boolean): string {
  // EASE-IN, NOT EASE-OUT, and it is the whole difference between a row that
  // drifts and one that is swept away: accelerating as it leaves reads as the
  // row being sent somewhere, while decelerating reads as it arriving - which
  // is the opposite of what just happened.
  //
  // All the way off the right edge rather than a nudge, so the row is gone
  // when the list refreshes underneath it instead of blinking out halfway.
  const motion =
    'transition-all duration-300 ease-[cubic-bezier(0.32,0,0.67,0)] will-change-transform motion-reduce:transition-none'
  return isLeaving
    ? `translate-x-[110%] opacity-0 pointer-events-none ${motion}`
    : `translate-x-0 opacity-100 ${motion}`
}

/**
 * Flagged jobs first, then the rest in the order they arrived.
 *
 * A JOB WITH A PROBLEM IS THE ONE WORTH LOOKING AT, and with fifty rows to a
 * page it would otherwise sit wherever the sort happened to put it - usually
 * out of sight. Stable within each group, so the queue does not reshuffle
 * under somebody mid-click.
 */
export function issuesFirst<T extends { id: string }>(jobs: T[], issues: StationIssuesByJob): T[] {
  const flagged = jobs.filter(job => Boolean(issues[job.id]))
  if (flagged.length === 0) return jobs
  return [...flagged, ...jobs.filter(job => !issues[job.id])]
}

/**
 * The problem somebody recorded against a job, on the row.
 *
 * IN THE ROW RATHER THAN BEHIND A HOVER, because the point of raising an
 * issue is that the next person to touch the job sees it without going
 * looking. Null when there is nothing wrong, so the column stays quiet on a
 * healthy queue.
 */
export function IssueTag({ issue }: { issue?: StationIssue }): JSX.Element | null {
  if (!issue) return null
  // The reason codes are stored machine-side; spelled out here so the row
  // reads as a sentence rather than as a database value.
  const words = ISSUE_WORDS[issue.reason] ?? issue.reason.replaceAll('_', ' ')
  const where = issue.stage ? ` at ${STAGE_WORDS[issue.stage] ?? issue.stage}` : ''
  return (
    <span
      className="tag tag-danger inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px]"
      title={issue.comment ? `${words}${where} — ${issue.comment}` : `${words}${where}`}
    >
      <AlertTriangle className="size-3" aria-hidden />
      {words}
      {where}
    </span>
  )
}

const ISSUE_WORDS: Record<string, string> = {
  missing_part: 'Missing part',
  damaged_part: 'Damaged part',
  poor_surface_finish: 'Poor surface finish',
  wrong_colour: 'Wrong colour',
  wrong_personalisation: 'Wrong personalisation',
  dimension_out_of_spec: 'Out of spec',
  cracked: 'Cracked',
  warped: 'Warped',
  hardware_missing: 'Hardware missing',
  addon_faulty: 'Add-on faulty',
  other: 'Issue raised',
}

const STAGE_WORDS: Record<string, string> = {
  assembly: 'assembly',
  finishing: 'finishing',
  qc: 'QC',
}
