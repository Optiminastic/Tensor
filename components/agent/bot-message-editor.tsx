'use client'

import { GripVertical, Plus, Trash2 } from 'lucide-react'
import { type JSX, useState } from 'react'

import { saveBotContentAction } from '@/app/dashboard/[brand]/agent/bot-messages/actions'
import { BotRowFields } from '@/components/agent/bot-row-fields'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import type { BotContent, BotContentRow } from '@/lib/validators/whatsapp-bot-content'

interface BotMessageEditorProps {
  brand: string
  initial: BotContent
  canEdit: boolean
}

/** A new question starts with a key nothing else uses. */
function newRow(position: number): BotContentRow {
  return {
    kind: 'faq',
    key: `faq_${Date.now().toString(36)}`,
    title: '',
    description: '',
    answer: '',
    position,
    enabled: true,
    from_code: false,
    locked: false,
  }
}

/**
 * What the bot says, as the shop writes it.
 *
 * SAVED AS A WHOLE SET. Which questions exist and the order they appear in is
 * one decision, so the page sends everything at once - otherwise "delete this
 * one" needs a second call that can fail on its own, leaving the list half
 * edited.
 */
export function BotMessageEditor({ brand, initial, canEdit }: BotMessageEditorProps): JSX.Element {
  const [menu, setMenu] = useState(initial.menu)
  const [faq, setFaq] = useState(initial.faq)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const limits = initial.limits

  function patch(list: 'menu' | 'faq', index: number, change: Partial<BotContentRow>): void {
    setSaved(false)
    const apply = (rows: BotContentRow[]): BotContentRow[] =>
      rows.map((r, i) => (i === index ? { ...r, ...change } : r))
    if (list === 'menu') setMenu(apply)
    else setFaq(apply)
  }

  function move(index: number, by: number): void {
    const next = [...faq]
    const to = index + by
    if (to < 0 || to >= next.length) return
    ;[next[index], next[to]] = [next[to], next[index]]
    setFaq(next.map((r, i) => ({ ...r, position: i })))
    setSaved(false)
  }

  async function save(): Promise<void> {
    setSaving(true)
    setError(null)
    const result = await saveBotContentAction({
      brand,
      menu: menu.map((r, i) => ({ ...r, position: i })),
      faq: faq.map((r, i) => ({ ...r, position: i })),
    })
    setSaving(false)
    if (!result.ok || !result.data) {
      setError(result.error ?? 'Could not save that.')
      return
    }
    setMenu(result.data.menu)
    setFaq(result.data.faq)
    setSaved(true)
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="flex flex-col gap-4">
        <header className="flex flex-col gap-1">
          <h2 className="text-sm font-medium">The three buttons</h2>
          <p className="text-muted-foreground text-xs text-pretty">
            Shown under the greeting on any message. You can rename them; what each one does is
            built in, so a button cannot be removed or repointed here.
          </p>
        </header>
        {menu.map((row, i) => (
          <BotRowFields
            key={row.key}
            row={row}
            limits={limits}
            canEdit={canEdit}
            onChange={change => patch('menu', i, change)}
          />
        ))}
      </Card>

      <Card className="flex flex-col gap-4">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <h2 className="text-sm font-medium">Questions behind “Other”</h2>
            <p className="text-muted-foreground text-xs text-pretty">
              {faq.length} of {limits.faq_rows} — WhatsApp shows at most {limits.faq_rows} in one
              list. A question with an answer is sent straight back; the greyed ones start a
              conversation instead.
            </p>
          </div>
          {canEdit ? (
            <Button
              variant="secondary"
              disabled={faq.length >= limits.faq_rows}
              onClick={() => {
                setFaq([...faq, newRow(faq.length)])
                setSaved(false)
              }}
            >
              <Plus className="size-4" aria-hidden />
              Add a question
            </Button>
          ) : null}
        </header>

        {faq.map((row, i) => (
          <div key={row.key} className="flex items-start gap-2">
            {canEdit ? (
              <div className="flex flex-col items-center gap-1 pt-2">
                <GripVertical className="text-subtle-foreground size-4" aria-hidden />
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  aria-label={`Move ${row.title || 'this question'} up`}
                  className="text-muted-foreground hover:text-foreground text-xs disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === faq.length - 1}
                  aria-label={`Move ${row.title || 'this question'} down`}
                  className="text-muted-foreground hover:text-foreground text-xs disabled:opacity-30"
                >
                  ↓
                </button>
              </div>
            ) : null}
            <div className="flex-1">
              <BotRowFields
                row={row}
                limits={limits}
                canEdit={canEdit}
                onChange={change => patch('faq', i, change)}
              />
            </div>
            {canEdit && !row.locked ? (
              <button
                type="button"
                onClick={() => {
                  setFaq(faq.filter((_, j) => j !== i))
                  setSaved(false)
                }}
                aria-label={`Remove ${row.title || 'this question'}`}
                className="text-muted-foreground hover:text-danger pt-2"
              >
                <Trash2 className="size-4" aria-hidden />
              </button>
            ) : null}
          </div>
        ))}
      </Card>

      {error ? (
        <p role="alert" className="text-danger text-sm text-pretty">
          {error}
        </p>
      ) : null}

      {canEdit ? (
        <div className="flex items-center gap-3">
          <Button onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save and send this from now on'}
          </Button>
          {saved ? <span className="text-success text-sm">Saved.</span> : null}
        </div>
      ) : null}
    </div>
  )
}
