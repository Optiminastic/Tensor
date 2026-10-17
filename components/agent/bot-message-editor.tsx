'use client'

import { Plus } from 'lucide-react'
import { type JSX, useState } from 'react'

import { saveBotContentAction } from '@/app/dashboard/[brand]/agent/bot-messages/actions'
import { BotRowFields, Counter } from '@/components/agent/bot-row-fields'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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

  function patchFaq(index: number, change: Partial<BotContentRow>): void {
    setSaved(false)
    setFaq(rows => rows.map((r, i) => (i === index ? { ...r, ...change } : r)))
  }

  function move(index: number, by: number): void {
    const to = index + by
    if (to < 0 || to >= faq.length) return
    const next = [...faq]
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
    <div className="flex w-full flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>The three buttons</CardTitle>
          <CardDescription>
            Shown under the greeting on any message. You can rename them; what each one does is
            built in, so a button cannot be removed or repointed here.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-5 sm:grid-cols-3">
          {menu.map((row, i) => (
            <div key={row.key} className="flex flex-col gap-1.5">
              <div className="flex items-baseline justify-between gap-2">
                <Label htmlFor={`menu-${row.key}`}>Button {i + 1}</Label>
                <Counter length={row.title.length} max={limits.menu_title} />
              </div>
              <Input
                id={`menu-${row.key}`}
                value={row.title}
                disabled={!canEdit}
                onChange={e => {
                  setSaved(false)
                  setMenu(rows =>
                    rows.map((r, j) => (j === i ? { ...r, title: e.target.value } : r)),
                  )
                }}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row flex-wrap items-start justify-between gap-3">
          <div className="flex min-w-0 flex-col gap-1.5">
            <CardTitle>Questions behind “Other”</CardTitle>
            <CardDescription>
              {faq.length} of {limits.faq_rows} — WhatsApp shows at most {limits.faq_rows} in one
              list. A question with an answer is sent straight back; the greyed ones start a
              conversation instead.
            </CardDescription>
          </div>
          {canEdit ? (
            <Button
              variant="secondary"
              className="shrink-0"
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
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {faq.map((row, i) => (
            <BotRowFields
              key={row.key}
              row={row}
              index={i}
              count={faq.length}
              limits={limits}
              canEdit={canEdit}
              onChange={change => patchFaq(i, change)}
              onMove={by => move(i, by)}
              onRemove={() => {
                setFaq(faq.filter((_, j) => j !== i))
                setSaved(false)
              }}
            />
          ))}
        </CardContent>
      </Card>

      {error ? (
        <p role="alert" className="text-danger text-sm text-pretty">
          {error}
        </p>
      ) : null}

      {canEdit ? (
        <div className="flex items-center gap-3">
          <Button onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
          <span className="text-muted-foreground text-xs">
            {saved
              ? 'Saved — the next message uses this.'
              : 'Applies to the next customer message.'}
          </span>
        </div>
      ) : null}
    </div>
  )
}
