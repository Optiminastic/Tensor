'use client'

import { ChevronRight, MessageSquarePlus, Plus } from 'lucide-react'
import { type JSX, useState } from 'react'

import { saveBotContentAction } from '@/app/dashboard/[brand]/agent/bot-messages/actions'
import { BotMessagePreview } from '@/components/agent/bot-message-preview'
import { BotOptionEditor } from '@/components/agent/bot-option-editor'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  type BotNode,
  type BotOption,
  type BotTree,
  messageName,
  optionCap,
} from '@/lib/validators/whatsapp-bot-content'

interface BotFlowEditorProps {
  brand: string
  initial: BotTree
  canEdit: boolean
}

/**
 * The WhatsApp bot, edited as the conversation it is.
 *
 * YOU WALK IT THE WAY A CUSTOMER DOES. The page shows one message at a time
 * as it will arrive on a phone; following a button that opens another
 * message takes you there, and the trail back sits above it. A tree drawn as
 * a diagram would show the same facts and answer none of the questions a
 * shop actually has, which are "what will they see" and "what happens when
 * they press this".
 *
 * SAVED AS A WHOLE TREE. Which messages exist, which options are on them and
 * the order of both are one decision; sending them piecemeal would leave a
 * half-saved menu behind a second call that failed on its own.
 */
export function BotFlowEditor({ brand, initial, canEdit }: BotFlowEditorProps): JSX.Element {
  const [nodes, setNodes] = useState<BotNode[]>(initial.nodes)
  const [path, setPath] = useState<string[]>([initial.root])
  const [selected, setSelected] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const limits = initial.limits

  const currentKey = path[path.length - 1]
  const node = nodes.find(n => n.key === currentKey) ?? nodes[0]
  const option = node?.options.find(o => o.key === selected) ?? null

  function touch(): void {
    setSaved(false)
    setError(null)
  }

  function patchNode(change: Partial<BotNode>): void {
    touch()
    setNodes(all => all.map(n => (n.key === node.key ? { ...n, ...change } : n)))
  }

  function patchOption(key: string, change: Partial<BotOption>): void {
    touch()
    setNodes(all =>
      all.map(n =>
        n.key === node.key
          ? { ...n, options: n.options.map(o => (o.key === key ? { ...o, ...change } : o)) }
          : n,
      ),
    )
    if (change.key && change.key !== key) setSelected(change.key)
  }

  function addOption(): void {
    const key = `opt_${Date.now().toString(36)}`
    touch()
    setNodes(all =>
      all.map(n =>
        n.key === node.key
          ? {
              ...n,
              options: [
                ...n.options,
                {
                  key,
                  title: '',
                  description: '',
                  action: 'answer' as const,
                  answer: '',
                  target: '',
                  button_label: '',
                  enabled: true,
                },
              ],
            }
          : n,
      ),
    )
    setSelected(key)
  }

  function moveOption(key: string, by: number): void {
    touch()
    setNodes(all =>
      all.map(n => {
        if (n.key !== node.key) return n
        const from = n.options.findIndex(o => o.key === key)
        const to = from + by
        if (from < 0 || to < 0 || to >= n.options.length) return n
        const options = [...n.options]
        ;[options[from], options[to]] = [options[to], options[from]]
        return { ...n, options }
      }),
    )
  }

  function removeOption(key: string): void {
    touch()
    setNodes(all =>
      all.map(n =>
        n.key === node.key ? { ...n, options: n.options.filter(o => o.key !== key) } : n,
      ),
    )
    if (selected === key) setSelected(null)
  }

  function addMessage(): void {
    const key = `msg_${Date.now().toString(36)}`
    touch()
    setNodes(all => [
      ...all,
      { key, kind: 'list', body: '', list_button: 'See options', options: [] },
    ])
    setPath(p => [...p, key])
    setSelected(null)
  }

  function follow(nodeKey: string): void {
    setPath(p => [...p, nodeKey])
    setSelected(null)
  }

  function jumpTo(index: number): void {
    setPath(p => p.slice(0, index + 1))
    setSelected(null)
  }

  async function save(): Promise<void> {
    setSaving(true)
    setError(null)
    const result = await saveBotContentAction({ brand, nodes })
    setSaving(false)
    if (!result.ok || !result.data) {
      setError(result.error ?? 'Could not save that.')
      return
    }
    setNodes(result.data.nodes)
    setSaved(true)
  }

  if (!node) {
    return <p className="text-danger text-sm">This bot has no messages to show.</p>
  }

  const cap = optionCap(node, limits)
  const isRoot = node.key === initial.root

  return (
    <div className="flex w-full flex-col gap-6">
      <Trail nodes={nodes} path={path} onJump={jumpTo} />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] lg:items-start">
        <div className="flex flex-col gap-3 lg:sticky lg:top-6">
          <BotMessagePreview
            node={node}
            nodes={nodes}
            limits={limits}
            selectedKey={selected}
            onSelect={setSelected}
            onFollow={follow}
          />
          <p className="text-subtle-foreground text-xs text-pretty">
            {isRoot
              ? 'This is what anyone who messages the number gets, whatever they say.'
              : 'Customers reach this by tapping an option on another message.'}
          </p>
        </div>

        <div className="flex min-w-0 flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>The message</CardTitle>
              <CardDescription>
                {isRoot
                  ? 'The greeting. Every unrecognised message gets this one.'
                  : messageName(node)}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="body">What it says</Label>
                <Textarea
                  id="body"
                  rows={4}
                  value={node.body}
                  disabled={!canEdit}
                  placeholder="👋 Hi! Welcome to the shop."
                  onChange={e => patchNode({ body: e.target.value })}
                />
                <p className="text-subtle-foreground text-xs">
                  Wrap a phrase in *asterisks* to make it bold, as WhatsApp does.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="kind">How the options are shown</Label>
                  <Select
                    id="kind"
                    value={node.kind}
                    disabled={!canEdit}
                    onChange={e => patchNode({ kind: e.target.value as BotNode['kind'] })}
                  >
                    <option value="buttons">Buttons — up to {limits.buttons}</option>
                    <option value="list">A list — up to {limits.rows}</option>
                  </Select>
                  {/* Meta's rule, said where the decision is made rather than
                      discovered when the bot stops answering. */}
                  <p className="text-subtle-foreground text-xs text-pretty">
                    WhatsApp allows {limits.buttons} buttons under a message. A list holds{' '}
                    {limits.rows}, behind one button the customer taps first.
                  </p>
                </div>

                {node.kind === 'list' ? (
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="list-button">Words on that button</Label>
                    <Input
                      id="list-button"
                      value={node.list_button}
                      disabled={!canEdit}
                      placeholder="See questions"
                      onChange={e => patchNode({ list_button: e.target.value })}
                    />
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row flex-wrap items-start justify-between gap-3">
              <div className="flex min-w-0 flex-col gap-1.5">
                <CardTitle>What they can tap</CardTitle>
                <CardDescription>
                  {node.options.length} of {cap}. Pick one in the preview to edit it.
                </CardDescription>
              </div>
              {canEdit ? (
                <Button variant="secondary" className="shrink-0" onClick={addOption}>
                  <Plus className="size-4" aria-hidden />
                  Add an option
                </Button>
              ) : null}
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {node.options.length === 0 ? (
                <p className="text-muted-foreground text-sm text-pretty">
                  Nothing to tap yet — this message is sent on its own.
                </p>
              ) : option === null ? (
                <p className="text-muted-foreground text-sm text-pretty">
                  Choose an option in the preview on the left to change what it says or does.
                </p>
              ) : (
                <BotOptionEditor
                  key={option.key}
                  option={option}
                  context={{
                    node,
                    nodes,
                    limits,
                    index: node.options.findIndex(o => o.key === option.key),
                    count: node.options.length,
                  }}
                  onChange={change => patchOption(option.key, change)}
                  onMove={by => moveOption(option.key, by)}
                  onRemove={() => removeOption(option.key)}
                />
              )}
            </CardContent>
          </Card>

          {canEdit ? (
            <Button variant="secondary" className="w-fit" onClick={addMessage}>
              <MessageSquarePlus className="size-4" aria-hidden />
              Add another message
            </Button>
          ) : null}
        </div>
      </div>

      {error ? (
        <p role="alert" className="text-danger text-sm text-pretty">
          {error}
        </p>
      ) : null}

      {canEdit ? (
        <div className="border-border/70 flex items-center gap-3 border-t pt-5">
          <Button onClick={save} disabled={saving}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
          <span className="text-muted-foreground text-xs">
            {saved
              ? 'Saved — the next customer message uses this.'
              : 'Applies to the next customer message.'}
          </span>
        </div>
      ) : null}
    </div>
  )
}

/** Where you are in the conversation, and the way back out of it. */
function Trail({
  nodes,
  path,
  onJump,
}: {
  nodes: BotNode[]
  path: string[]
  onJump: (index: number) => void
}): JSX.Element {
  return (
    <nav
      aria-label="Where you are in the bot"
      className="flex flex-wrap items-center gap-1 text-sm"
    >
      {path.map((key, i) => {
        const node = nodes.find(n => n.key === key)
        const label = node ? messageName(node) : key
        const last = i === path.length - 1
        return (
          <span key={`${key}-${i}`} className="flex items-center gap-1">
            {i > 0 ? (
              <ChevronRight className="text-subtle-foreground size-3.5 shrink-0" aria-hidden />
            ) : null}
            <button
              type="button"
              onClick={() => onJump(i)}
              aria-current={last ? 'page' : undefined}
              className={
                last
                  ? 'text-foreground max-w-[16rem] truncate font-medium'
                  : 'text-muted-foreground hover:text-foreground max-w-[12rem] truncate underline-offset-4 hover:underline'
              }
            >
              {i === 0 ? 'First message' : label}
            </button>
          </span>
        )
      })}
    </nav>
  )
}
