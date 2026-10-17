'use client'

import type { JSX } from 'react'

import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { BotContentLimits, BotContentRow } from '@/lib/validators/whatsapp-bot-content'

interface BotRowFieldsProps {
  row: BotContentRow
  limits: BotContentLimits
  canEdit: boolean
  onChange: (change: Partial<BotContentRow>) => void
}

/**
 * One editable row: a button's label, or a question with its answer.
 *
 * THE COUNTER IS NOT DECORATION. Meta refuses the whole message when one
 * title is too long and tells you neither which row nor which rule, so the
 * bot would just stop answering. Showing the remaining characters as they
 * type is the only warning anybody gets.
 */
export function BotRowFields({ row, limits, canEdit, onChange }: BotRowFieldsProps): JSX.Element {
  const isMenu = row.kind === 'menu'
  const titleMax = isMenu ? limits.menu_title : limits.faq_title
  const over = row.title.length > titleMax

  return (
    <div className="border-border flex flex-col gap-3 rounded-xl border p-3">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between gap-3">
          <label className="text-subtle-foreground text-[11px] tracking-wide uppercase">
            {isMenu ? 'Button label' : 'Question'}
          </label>
          <span
            className={cn(
              'font-mono text-[11px] tabular-nums',
              over ? 'text-danger' : 'text-muted-foreground',
            )}
          >
            {row.title.length}/{titleMax}
          </span>
        </div>
        <Input
          value={row.title}
          disabled={!canEdit}
          onChange={e => onChange({ title: e.target.value })}
          placeholder={isMenu ? 'Damage concern' : 'Delivery time'}
        />
      </div>

      {!isMenu ? (
        <>
          <div className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-3">
              <label className="text-subtle-foreground text-[11px] tracking-wide uppercase">
                Note under it
              </label>
              <span
                className={cn(
                  'font-mono text-[11px] tabular-nums',
                  row.description.length > limits.faq_description
                    ? 'text-danger'
                    : 'text-muted-foreground',
                )}
              >
                {row.description.length}/{limits.faq_description}
              </span>
            </div>
            <Input
              value={row.description}
              disabled={!canEdit}
              onChange={e => onChange({ description: e.target.value })}
              placeholder="When will my order reach me?"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-subtle-foreground text-[11px] tracking-wide uppercase">
              Answer
            </label>
            {row.locked ? (
              // A row that opens a conversation rather than printing a reply.
              // Its wording lives in the flow, so an answer box here would be
              // a field that is saved and never sent.
              <p className="text-muted-foreground text-xs text-pretty">
                This one starts a conversation — order tracking or handing over to a person — so it
                has no fixed answer. You can still rename it.
              </p>
            ) : (
              <Textarea
                rows={4}
                value={row.answer}
                disabled={!canEdit}
                onChange={e => onChange({ answer: e.target.value })}
                placeholder="What the customer is sent when they tap this."
              />
            )}
          </div>

          {canEdit ? (
            <label className="text-muted-foreground flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={row.enabled}
                onChange={e => onChange({ enabled: e.target.checked })}
              />
              Show this question
            </label>
          ) : null}
        </>
      ) : null}
    </div>
  )
}
