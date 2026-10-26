'use client'

import { ArrowDown, ArrowUp, Trash2 } from 'lucide-react'
import type { JSX } from 'react'

import { Counter } from '@/components/agent/bot-row-fields'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  type BotAction,
  type BotLimits,
  type BotNode,
  type BotOption,
  RESERVED_IDS,
} from '@/lib/validators/whatsapp-bot-content'

/**
 * What a button can be made to do, in the order a shop reaches for them.
 *
 * The last three change the conversation's state and so live in Tensor-Core's
 * state machine, which cannot read this table - their ids are reserved and
 * set for you when the action is picked. Everything else is pure data.
 */
const ACTIONS: { value: BotAction; label: string; help: string }[] = [
  {
    value: 'answer',
    label: 'Send a reply',
    help: 'One message straight back, then the menu hint.',
  },
  { value: 'open', label: 'Open another message', help: 'This is what makes a second level.' },
  { value: 'url', label: 'Open a link', help: 'A button that takes them to a web page.' },
  {
    value: 'damage',
    label: 'Send the damage form',
    help: 'Mints a private upload link, good for 24 hours.',
  },
  { value: 'track', label: 'Track an order', help: 'Asks for the order number, then looks it up.' },
  {
    value: 'team',
    label: 'Hand over to a person',
    help: 'Silences the bot on this chat for 12 hours.',
  },
  {
    value: 'feedback',
    label: 'Ask for feedback',
    help: 'Invites them to type it, then hands over like the option above.',
  },
]

interface BotOptionEditorProps {
  option: BotOption
  context: { node: BotNode; nodes: BotNode[]; limits: BotLimits; index: number; count: number }
  onChange: (change: Partial<BotOption>) => void
  onMove: (by: number) => void
  onRemove: () => void
}

export function BotOptionEditor({
  option,
  context,
  onChange,
  onMove,
  onRemove,
}: BotOptionEditorProps): JSX.Element {
  const { node, nodes, limits, index, count } = context
  const list = node.kind === 'list'
  const titleCap = list ? limits.title : limits.button_title
  const action = ACTIONS.find(a => a.value === option.action)
  const name = option.title || 'this option'

  function changeAction(next: BotAction): void {
    // A code action's id is what Tensor-Core's state machine listens for, so
    // picking one sets the id too - and leaving one frees it again. Getting
    // this wrong is a button that silently does nothing.
    const reserved = RESERVED_IDS[next]
    const leavingReserved = RESERVED_IDS[option.action] !== undefined
    onChange({
      action: next,
      ...(reserved ? { key: reserved } : {}),
      ...(leavingReserved && !reserved ? { key: `opt_${Date.now().toString(36)}` } : {}),
    })
  }

  return (
    <div className="border-border/70 bg-surface flex flex-col gap-4 rounded-2xl border p-4">
      <div className="flex items-start gap-3">
        <div className="grid min-w-0 flex-1 gap-4 sm:grid-cols-2">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-2">
              <Label htmlFor={`t-${option.key}`}>{list ? 'Row title' : 'Button label'}</Label>
              <Counter length={option.title.length} max={titleCap} />
            </div>
            <Input
              id={`t-${option.key}`}
              value={option.title}
              placeholder={list ? 'Delivery time' : 'Explore products'}
              onChange={e => onChange({ title: e.target.value })}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor={`a-${option.key}`}>What it does</Label>
            <Select
              id={`a-${option.key}`}
              value={option.action}
              onChange={e => changeAction(e.target.value as BotAction)}
            >
              {ACTIONS.map(a => (
                <option key={a.value} value={a.value}>
                  {a.label}
                </option>
              ))}
            </Select>
            {action ? (
              <p className="text-subtle-foreground text-xs text-pretty">{action.help}</p>
            ) : null}
          </div>
        </div>

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
          <IconButton label={`Remove ${name}`} danger onClick={onRemove}>
            <Trash2 className="size-4" aria-hidden />
          </IconButton>
        </div>
      </div>

      {list ? (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-baseline justify-between gap-2">
            <Label htmlFor={`d-${option.key}`}>Note under it</Label>
            <Counter length={option.description.length} max={limits.description} />
          </div>
          <Input
            id={`d-${option.key}`}
            value={option.description}
            placeholder="When will my order reach me?"
            onChange={e => onChange({ description: e.target.value })}
          />
        </div>
      ) : null}

      <ActionFields option={option} nodes={nodes} onChange={onChange} />

      <label className="text-muted-foreground flex w-fit items-center gap-2 text-xs">
        <input
          type="checkbox"
          className="accent-accent size-3.5"
          checked={option.enabled}
          onChange={e => onChange({ enabled: e.target.checked })}
        />
        Show this option
      </label>
    </div>
  )
}

/** The fields that only make sense for the action that was picked. */
function ActionFields({
  option,
  nodes,
  onChange,
}: {
  option: BotOption
  nodes: BotNode[]
  onChange: (change: Partial<BotOption>) => void
}): JSX.Element | null {
  if (option.action === 'answer') {
    return (
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`r-${option.key}`}>The reply</Label>
        <Textarea
          id={`r-${option.key}`}
          rows={5}
          value={option.answer}
          placeholder="What the customer is sent when they tap this."
          onChange={e => onChange({ answer: e.target.value })}
        />
      </div>
    )
  }

  if (option.action === 'open') {
    const missing = option.target !== '' && !nodes.some(n => n.key === option.target)
    return (
      <div className="flex flex-col gap-1.5">
        <Label htmlFor={`o-${option.key}`}>Which message it opens</Label>
        <Select
          id={`o-${option.key}`}
          value={option.target}
          onChange={e => onChange({ target: e.target.value })}
        >
          <option value="">Choose a message…</option>
          {nodes.map(n => (
            <option key={n.key} value={n.key}>
              {n.key}
            </option>
          ))}
        </Select>
        {missing ? (
          <p className="text-danger text-xs">
            That message no longer exists, so this button would answer nothing.
          </p>
        ) : null}
      </div>
    )
  }

  if (option.action === 'url') {
    return (
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`u-${option.key}`}>Web address</Label>
          <Input
            id={`u-${option.key}`}
            value={option.target}
            inputMode="url"
            placeholder="https://the3dprintingstore.in/"
            onChange={e => onChange({ target: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={`b-${option.key}`}>Words on the link button</Label>
          <Input
            id={`b-${option.key}`}
            value={option.button_label}
            placeholder="Visit store"
            onChange={e => onChange({ button_label: e.target.value })}
          />
        </div>
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <Label htmlFor={`ut-${option.key}`}>Message above the button</Label>
          <Textarea
            id={`ut-${option.key}`}
            rows={3}
            value={option.answer}
            placeholder="Have a look around our shop…"
            onChange={e => onChange({ answer: e.target.value })}
          />
        </div>
      </div>
    )
  }

  // A code action. Its wording lives in the flow it starts, so an answer box
  // here would be a field that is saved and never sent.
  return (
    <p className="text-muted-foreground text-xs text-pretty">
      This one starts a conversation, so it has no fixed reply — what it says comes from the flow
      behind it. You can still rename it and move it.
    </p>
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
      className={
        danger
          ? 'text-muted-foreground hover:text-danger hover:bg-danger-subtle rounded-lg p-1.5 transition-colors disabled:opacity-30'
          : 'text-muted-foreground hover:text-foreground hover:bg-surface-muted rounded-lg p-1.5 transition-colors disabled:opacity-30'
      }
    >
      {children}
    </button>
  )
}
