'use client'

import {
  ChevronRight,
  CornerDownRight,
  ExternalLink,
  FileWarning,
  Headset,
  List,
} from 'lucide-react'
import type { JSX } from 'react'

import { cn } from '@/lib/utils'
import {
  type BotNode,
  type BotOption,
  describeAction,
  optionCap,
  type BotLimits,
} from '@/lib/validators/whatsapp-bot-content'

interface BotMessagePreviewProps {
  node: BotNode
  nodes: BotNode[]
  limits: BotLimits
  selectedKey: string | null
  onSelect: (key: string | null) => void
  onFollow: (nodeKey: string) => void
}

/**
 * One message as the customer will see it, laid out the way WhatsApp lays it
 * out: the words in a bubble, and the options as full-width rows beneath,
 * divided by hairlines.
 *
 * THE PREVIEW IS THE NAVIGATION. Tapping an option here selects it for
 * editing, and an option that opens another message walks you to it - the
 * same path the customer takes. That is what makes the hierarchy legible
 * without a diagram: you read the bot by using it.
 *
 * Under each option, in small type, is what it actually does. A button whose
 * label says "Explore products" and whose action opens a link is the kind of
 * thing that is obvious while you are writing it and a mystery three months
 * later.
 *
 * It is WhatsApp's SHAPE, not its colours. The palette stays Tensor's, so
 * the page does not read as a screenshot of another product dropped into the
 * dashboard.
 */
export function BotMessagePreview({
  node,
  nodes,
  limits,
  selectedKey,
  onSelect,
  onFollow,
}: BotMessagePreviewProps): JSX.Element {
  const cap = optionCap(node, limits)
  const over = node.options.length > cap

  return (
    <div className="bg-surface-muted flex flex-col gap-3 rounded-2xl p-4 sm:p-5">
      <div className="max-w-[22rem]">
        {/* The incoming bubble: square top-left corner for the tail, as
            WhatsApp draws a message from the other side. */}
        <div className="bg-surface border-border/60 rounded-2xl rounded-tl-sm border px-3.5 py-2.5 shadow-xs">
          <p className="text-foreground text-sm whitespace-pre-wrap">
            {node.body.trim() === '' ? (
              <span className="text-subtle-foreground italic">Nothing to say yet</span>
            ) : (
              formatWhatsApp(node.body)
            )}
          </p>
        </div>

        {node.kind === 'list' ? (
          <ListSheet
            node={node}
            nodes={nodes}
            cap={cap}
            selectedKey={selectedKey}
            onSelect={onSelect}
            onFollow={onFollow}
          />
        ) : (
          <div className="mt-1 flex flex-col gap-1">
            {node.options.map((option, i) => (
              <OptionRow
                key={option.key}
                option={option}
                nodes={nodes}
                beyondCap={i >= cap}
                selected={selectedKey === option.key}
                onSelect={() => onSelect(option.key)}
                onFollow={onFollow}
              />
            ))}
          </div>
        )}
      </div>

      {over ? (
        <p className="text-danger text-xs text-pretty">
          {node.kind === 'list'
            ? `WhatsApp shows ${limits.rows} rows in a list. The ones below the line are never sent.`
            : `WhatsApp shows ${limits.buttons} buttons under a message — a fourth is not something it can send. Switch this message to a list to offer more.`}
        </p>
      ) : null}
    </div>
  )
}

function ListSheet({
  node,
  nodes,
  cap,
  selectedKey,
  onSelect,
  onFollow,
}: {
  node: BotNode
  nodes: BotNode[]
  cap: number
  selectedKey: string | null
  onSelect: (key: string) => void
  onFollow: (nodeKey: string) => void
}): JSX.Element {
  return (
    <div className="mt-1 flex flex-col gap-1">
      {/* The one button that opens the sheet - what the customer taps before
          they see a single row. */}
      <div className="bg-surface border-border/60 text-accent flex items-center justify-center gap-2 rounded-xl border py-2.5 text-sm font-medium shadow-xs">
        <List className="size-4" aria-hidden />
        {node.list_button.trim() || 'See options'}
      </div>
      <p className="text-subtle-foreground px-1 pt-1 text-[11px]">
        Then they pick from this sheet:
      </p>
      <div className="border-border/60 bg-surface divide-border/60 divide-y overflow-hidden rounded-xl border shadow-xs">
        {node.options.map((option, i) => (
          <OptionRow
            key={option.key}
            option={option}
            nodes={nodes}
            beyondCap={i >= cap}
            selected={selectedKey === option.key}
            inSheet
            onSelect={() => onSelect(option.key)}
            onFollow={onFollow}
          />
        ))}
      </div>
    </div>
  )
}

interface OptionRowProps {
  option: BotOption
  nodes: BotNode[]
  beyondCap: boolean
  selected: boolean
  inSheet?: boolean
  onSelect: () => void
  onFollow: (nodeKey: string) => void
}

function OptionRow({
  option,
  nodes,
  beyondCap,
  selected,
  inSheet = false,
  onSelect,
  onFollow,
}: OptionRowProps): JSX.Element {
  const opens = option.action === 'open' && nodes.some(n => n.key === option.target)

  return (
    <div
      className={cn(
        'group relative w-full text-left transition-colors',
        inSheet
          ? 'px-3 py-2.5'
          : 'bg-surface border-border/60 rounded-xl border px-3 py-2.5 shadow-xs',
        selected && 'ring-accent/40 ring-2',
        beyondCap && 'opacity-45',
        !option.enabled && 'opacity-45',
      )}
    >
      <button type="button" onClick={onSelect} className="flex w-full items-start gap-2 text-left">
        <span className="min-w-0 flex-1">
          <span
            className={cn(
              'block truncate text-sm',
              inSheet ? 'text-foreground font-medium' : 'text-accent text-center font-medium',
            )}
          >
            {option.title.trim() || 'Untitled option'}
          </span>
          {inSheet && option.description.trim() ? (
            <span className="text-muted-foreground block truncate text-xs">
              {option.description}
            </span>
          ) : null}
        </span>
      </button>

      <div className="mt-1.5 flex items-center justify-between gap-2">
        <span className="text-subtle-foreground flex items-center gap-1 text-[11px]">
          <ActionIcon action={option.action} />
          {describeAction(option, nodes)}
          {!option.enabled ? ' · hidden' : ''}
        </span>
        {opens ? (
          <button
            type="button"
            onClick={() => onFollow(option.target)}
            className="text-accent inline-flex shrink-0 items-center gap-0.5 text-[11px] underline-offset-2 hover:underline"
          >
            Follow
            <ChevronRight className="size-3" aria-hidden />
          </button>
        ) : null}
      </div>
    </div>
  )
}

function ActionIcon({ action }: { action: BotOption['action'] }): JSX.Element {
  const className = 'size-3 shrink-0'
  switch (action) {
    case 'open':
      return <CornerDownRight className={className} aria-hidden />
    case 'url':
      return <ExternalLink className={className} aria-hidden />
    case 'damage':
      return <FileWarning className={className} aria-hidden />
    case 'team':
      return <Headset className={className} aria-hidden />
    default:
      return <ChevronRight className={className} aria-hidden />
  }
}

/**
 * WhatsApp's own emphasis, rendered rather than shown as asterisks.
 *
 * Only *bold*, because that is all the shop uses and a half-built Markdown
 * parser in a preview is a liability: the point is to show what the customer
 * sees, and showing it slightly wrong is worse than showing it plainly.
 */
function formatWhatsApp(body: string): JSX.Element[] {
  return body.split(/(\*[^*\n]+\*)/g).map((part, i) =>
    part.startsWith('*') && part.endsWith('*') && part.length > 2 ? (
      <strong key={i} className="font-semibold">
        {part.slice(1, -1)}
      </strong>
    ) : (
      <span key={i}>{part}</span>
    ),
  )
}
