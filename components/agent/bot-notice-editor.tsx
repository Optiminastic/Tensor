'use client'

import { RotateCcw } from 'lucide-react'
import { type JSX, useMemo, useState } from 'react'

import {
  resetBotNoticeAction,
  saveBotNoticeAction,
} from '@/app/dashboard/[brand]/agent/bot-messages/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import type { BotNotice } from '@/lib/validators/whatsapp-bot-messages'

interface BotNoticeEditorProps {
  brand: string
  initial: BotNotice[]
  canEdit: boolean
}

/**
 * The messages the bot composes itself, as a list of boxes.
 *
 * SEPARATE FROM THE TREE ABOVE, because they are a different thing. A tree
 * node is a message with options under it and somewhere each one leads; these
 * have no options and no shape - they are the lines the bot sends on its own,
 * when a damage form goes out or a pickup is booked.
 *
 * SAVED ONE AT A TIME. The tree is sent whole because it is edited whole;
 * saving these together would let somebody fixing a typo quietly revert a
 * colleague's rewrite of a different message. Each box owns its own save.
 *
 * EVERY SAVE RETURNS THE WHOLE SET, so what is on screen afterwards is what is
 * actually stored - including a message the backend normalised away, which is
 * what happens when somebody edits one back to its original wording.
 */
export function BotNoticeEditor({ brand, initial, canEdit }: BotNoticeEditorProps): JSX.Element {
  const [messages, setMessages] = useState(initial)

  // Grouped for reading rather than scrolling: twenty boxes in one column is a
  // page nobody finds anything on.
  const groups = useMemo(() => {
    const byGroup = new Map<string, BotNotice[]>()
    for (const m of messages) {
      const list = byGroup.get(m.group) ?? []
      list.push(m)
      byGroup.set(m.group, list)
    }
    return [...byGroup.entries()]
  }, [messages])

  return (
    <div className="flex flex-col gap-6">
      {groups.map(([group, items]) => (
        <section key={group} className="flex flex-col gap-3">
          <h2 className="text-subtle-foreground text-[11px] font-medium tracking-wide uppercase">
            {group}
          </h2>
          <div className="flex flex-col gap-3">
            {items.map(message => (
              <NoticeCard
                key={message.key}
                brand={brand}
                message={message}
                canEdit={canEdit}
                onSaved={setMessages}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  )
}

function NoticeCard({
  brand,
  message,
  canEdit,
  onSaved,
}: {
  brand: string
  message: BotNotice
  canEdit: boolean
  onSaved: (messages: BotNotice[]) => void
}): JSX.Element {
  const [draft, setDraft] = useState(message.body)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  const trimmed = draft.trim()
  const changed = trimmed !== message.body.trim()
  const chars = [...draft].length
  const tooLong = chars > message.limit

  // THE SAME RULE THE BACKEND ENFORCES, said before the save rather than
  // after it. A message that lost its %s reaches a customer reading "order
  // now"; one that gained a second reaches them as %!s(MISSING).
  const placeholders = countPlaceholders(draft)
  const wrongPlaceholders = placeholders !== message.placeholders

  async function save(): Promise<void> {
    setBusy(true)
    setError(null)
    setSaved(false)
    const result = await saveBotNoticeAction({ brand, key: message.key, body: trimmed })
    setBusy(false)
    if (!result.ok || !result.data) {
      setError(result.error ?? 'Could not save that.')
      return
    }
    onSaved(result.data)
    setSaved(true)
  }

  async function reset(): Promise<void> {
    setBusy(true)
    setError(null)
    setSaved(false)
    const result = await resetBotNoticeAction({ brand, key: message.key })
    setBusy(false)
    if (!result.ok || !result.data) {
      setError(result.error ?? 'Could not reset that.')
      return
    }
    setDraft(message.default)
    onSaved(result.data)
  }

  return (
    <Card>
      <CardHeader className="flex-row flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-1">
          <CardTitle className="flex flex-wrap items-center gap-2 text-base">
            {message.label}
            {message.edited ? (
              <span className="tag tag-accent rounded-full px-2 py-0.5 text-[11px]">Edited</span>
            ) : null}
          </CardTitle>
          <CardDescription>{message.help}</CardDescription>
        </div>
        {canEdit && message.edited ? (
          <Button variant="ghost" size="sm" onClick={reset} disabled={busy}>
            <RotateCcw className="size-3" aria-hidden />
            Use the original
          </Button>
        ) : null}
      </CardHeader>

      <CardContent className="flex flex-col gap-2">
        <Textarea
          rows={Math.min(8, Math.max(3, draft.split('\n').length + 1))}
          value={draft}
          onChange={event => setDraft(event.target.value)}
          disabled={!canEdit || busy}
          aria-label={message.label}
        />

        <div className="text-subtle-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          <span
            className={tooLong ? 'text-danger font-mono tabular-nums' : 'font-mono tabular-nums'}
          >
            {chars} / {message.limit}
          </span>
          {message.placeholders > 0 ? (
            <span className={wrongPlaceholders ? 'text-danger' : undefined}>
              Must contain <span className="font-mono">%s</span> once — the order number goes there.
            </span>
          ) : null}
          {/* WhatsApp's own formatting, said once rather than guessed at. */}
          <span>
            <span className="font-mono">*bold*</span> · <span className="font-mono">_italic_</span>
          </span>
        </div>

        {error ? (
          <p role="alert" className="text-danger text-sm text-pretty">
            {error}
          </p>
        ) : null}
        {saved && !changed ? (
          <p role="status" className="text-success text-sm">
            Saved. The next message the bot sends uses this wording.
          </p>
        ) : null}

        {canEdit ? (
          <div>
            <Button
              size="sm"
              onClick={save}
              disabled={busy || !changed || tooLong || wrongPlaceholders || trimmed === ''}
            >
              {busy ? 'Saving…' : 'Save'}
            </Button>
          </div>
        ) : (
          <p className="text-subtle-foreground text-xs">
            You can read this wording but not change it.
          </p>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * How many `%s` the wording would substitute.
 *
 * `%%` IS NOT ONE. "20%% off" is an ordinary thing to write, and counting it
 * would block a perfectly good rewrite for a reason nobody could see. This
 * mirrors the backend's own count, so the form and the server agree on what
 * they are refusing.
 */
function countPlaceholders(text: string): number {
  let n = 0
  for (let i = 0; i < text.length; i++) {
    if (text[i] !== '%' || i + 1 >= text.length) continue
    const next = text[i + 1]
    if (next === '%') {
      i++
    } else if (next === 's' || next === 'v' || next === 'd' || next === 'q') {
      n++
      i++
    }
  }
  return n
}
