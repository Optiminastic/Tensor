'use client'

import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react'
import type { JSX } from 'react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { BotContentLimits, BotContentRow } from '@/lib/validators/whatsapp-bot-content'

interface BotRowFieldsProps {
  row: BotContentRow
  index: number
  count: number
  limits: BotContentLimits
  canEdit: boolean
  onChange: (change: Partial<BotContentRow>) => void
  onMove: (by: number) => void
  onRemove: () => void
}

/**
 * Characters used, against WhatsApp's cap.
 *
 * Mono tabular so it does not jiggle as it counts, and it turns red before the
 * save is refused rather than after: Meta rejects the whole message over one
 * long row and names neither the row nor the rule.
 */
export function Counter({ length, max }: { length: number; max: number }): JSX.Element {
  return (
    <span
      className={cn(
        'font-mono text-[11px] tabular-nums',
        length > max ? 'text-danger' : 'text-subtle-foreground',
      )}
    >
      {length}/{max}
    </span>
  )
}

/**
 * One question: what it is called, the note under it, and the answer it sends.
 *
 * The question and its note sit side by side because they are read together -
 * the note is the grey second line under the title in WhatsApp's own list, and
 * writing one without seeing the other is how they end up saying the same
 * thing twice.
 */
export function BotRowFields({
  row,
  index,
  count,
  limits,
  canEdit,
  onChange,
  onMove,
  onRemove,
}: BotRowFieldsProps): JSX.Element {
  const name = row.title || 'this question'
  return (
    <div
      className={cn(
        'border-border/70 bg-surface-muted/40 flex flex-col gap-4 rounded-2xl border p-4',
        !row.enabled && 'opacity-60',
      )}
    >
      <div className="flex items-start gap-3">
        <div className="grid min-w-0 flex-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-2">
              <Label htmlFor={`q-${row.key}`}>Question</Label>
              <Counter length={row.title.length} max={limits.faq_title} />
            </div>
            <Input
              id={`q-${row.key}`}
              value={row.title}
              disabled={!canEdit}
              placeholder="Delivery time"
              onChange={e => onChange({ title: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-2">
              <Label htmlFor={`n-${row.key}`}>Note under it</Label>
              <Counter length={row.description.length} max={limits.faq_description} />
            </div>
            <Input
              id={`n-${row.key}`}
              value={row.description}
              disabled={!canEdit}
              placeholder="When will my order reach me?"
              onChange={e => onChange({ description: e.target.value })}
            />
          </div>
        </div>

        {canEdit ? (
          <div className="flex shrink-0 items-center gap-0.5 pt-6">
            <IconButton label={`Move ${name} up`} disabled={index === 0} onClick={() => onMove(-1)}>
              <ArrowUp className="size-4" aria-hidden />
            </IconButton>
            <IconButton
              label={`Move ${name} down`}
              disabled={index === count - 1}
              onClick={() => onMove(1)}
            >
              <ArrowDown className="size-4" aria-hidden />
            </IconButton>
            {!row.locked ? (
              <IconButton label={`Remove ${name}`} danger onClick={onRemove}>
                <Trash2 className="size-4" aria-hidden />
              </IconButton>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`a-${row.key}`}>Answer</Label>
        {row.locked ? (
          // A row that opens a conversation rather than printing a reply. Its
          // wording lives in the flow, so an answer box here would be a field
          // that is saved and never sent.
          <p className="text-muted-foreground text-xs text-pretty">
            This one starts a conversation — order tracking, or handing over to a person — so it has
            no fixed answer. You can still rename it.
          </p>
        ) : (
          <Textarea
            id={`a-${row.key}`}
            rows={5}
            value={row.answer}
            disabled={!canEdit}
            placeholder="What the customer is sent when they tap this."
            onChange={e => onChange({ answer: e.target.value })}
          />
        )}
      </div>

      {canEdit ? (
        <label className="text-muted-foreground flex w-fit items-center gap-2 text-xs">
          <input
            type="checkbox"
            className="accent-accent size-3.5"
            checked={row.enabled}
            onChange={e => onChange({ enabled: e.target.checked })}
          />
          Show this question
        </label>
      ) : null}
    </div>
  )
}

function IconButton({
  label,
  onClick,
  disabled,
  danger,
  children,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  danger?: boolean
  children: JSX.Element
}): JSX.Element {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'text-muted-foreground rounded-lg p-1.5 transition-colors disabled:opacity-30',
        danger
          ? 'hover:text-danger hover:bg-danger-subtle'
          : 'hover:text-foreground hover:bg-surface',
      )}
    >
      {children}
    </button>
  )
}
