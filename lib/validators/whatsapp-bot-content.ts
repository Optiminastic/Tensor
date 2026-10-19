import { z } from 'zod'

/**
 * The WhatsApp bot as a tree of messages.
 *
 * A NODE IS ONE MESSAGE; an option is one button or list row on it, and the
 * option's `action` is what happens when it is tapped. That is the whole
 * model: "Explore products opens the shop's website" is a row of data, not a
 * branch in the backend.
 *
 * Three actions are different and the page has to treat them so. `damage`,
 * `track` and `team` each change the state of the conversation, which lives
 * in Tensor-Core's pure state machine - it cannot read this table. So those
 * three keep reserved ids the machine listens for. The shop can rename them,
 * reorder them, move them to another message or leave them out; it cannot
 * invent a fourth of them, and it cannot change their id.
 */
export const BotActionSchema = z.enum(['answer', 'open', 'url', 'damage', 'track', 'team'])
export type BotAction = z.infer<typeof BotActionSchema>

/** The ids Tensor-Core's state machine listens for. */
export const RESERVED_IDS: Partial<Record<BotAction, string>> = {
  damage: 'damage',
  track: 'track',
  team: 'team',
}

export const BotOptionSchema = z.object({
  key: z.string(),
  title: z.string(),
  description: z
    .string()
    .nullish()
    .transform(v => v ?? ''),
  action: BotActionSchema,
  /** What is sent for `answer`, and the lead-in text for `url`. */
  answer: z
    .string()
    .nullish()
    .transform(v => v ?? ''),
  /** A node key for `open`, a web address for `url`. */
  target: z
    .string()
    .nullish()
    .transform(v => v ?? ''),
  /** What the link button says for `url`. */
  button_label: z
    .string()
    .nullish()
    .transform(v => v ?? ''),
  enabled: z.boolean(),
})

export const BotNodeSchema = z.object({
  key: z.string(),
  /** 'buttons' shows up to 3 under the message; 'list' shows up to 10 behind one. */
  kind: z.enum(['buttons', 'list']),
  body: z.string(),
  list_button: z
    .string()
    .nullish()
    .transform(v => v ?? ''),
  options: z.array(BotOptionSchema),
})

/**
 * Meta's own caps, sent by Tensor-Core rather than duplicated here.
 *
 * They are not advice. WhatsApp refuses the WHOLE message when one row is
 * too long or a fourth button is present, and names neither the row nor the
 * rule - so the bot would simply stop answering, with nothing on screen to
 * say why.
 */
export const BotLimitsSchema = z.object({
  buttons: z.number(),
  rows: z.number(),
  nodes: z.number(),
  title: z.number(),
  button_title: z.number(),
  description: z.number(),
})

export const BotTreeSchema = z.object({
  nodes: z.array(BotNodeSchema),
  /** True while the shop is still on the shipped defaults. */
  from_code: z.boolean(),
  root: z.string(),
  limits: BotLimitsSchema,
})

export type BotOption = z.infer<typeof BotOptionSchema>
export type BotNode = z.infer<typeof BotNodeSchema>
export type BotLimits = z.infer<typeof BotLimitsSchema>
export type BotTree = z.infer<typeof BotTreeSchema>

/** How many options a node may carry, which depends on how it is shown. */
export function optionCap(node: BotNode, limits: BotLimits): number {
  return node.kind === 'list' ? limits.rows : limits.buttons
}

/** One line saying what an option does, for the summary under a button. */
export function describeAction(option: BotOption, nodes: BotNode[]): string {
  switch (option.action) {
    case 'answer':
      return 'Sends a reply'
    case 'open': {
      const target = nodes.find(n => n.key === option.target)
      // A target that is gone is a button that answers nothing, so it is
      // named rather than hidden behind a tidy label.
      return target ? `Opens “${messageName(target)}”` : 'Opens a message that is missing'
    }
    case 'url':
      return `Opens ${option.target || 'a link'}`
    case 'damage':
      return 'Sends the damage form'
    case 'track':
      return 'Asks for an order number'
    case 'team':
      return 'Hands the chat to a person'
  }
}

/** A short name for a message, taken from its own first line. */
export function messageName(node: BotNode): string {
  const first = node.body.split('\n').find(line => line.trim() !== '')
  if (!first) return node.key
  const cleaned = first.replace(/[*_~]/g, '').trim()
  return cleaned.length > 40 ? `${cleaned.slice(0, 40)}…` : cleaned
}
