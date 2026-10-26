import { describe, expect, it } from 'vitest'

import { type BotNode, messageName } from '@/lib/validators/whatsapp-bot-content'

function node(body: string): BotNode {
  return {
    key: 'questions',
    kind: 'list',
    body,
    list_button: '',
    options: [],
  } as BotNode
}

describe('messageName', () => {
  it('never cuts an emoji in half', () => {
    // THE REAL CASE. The FAQ message's first line is 39 characters and then a
    // 👇, so a cut at 40 UTF-16 units lands between the two halves of it. The
    // lone surrogate left behind renders one way in the server's HTML and
    // another after React hydrates, which fails hydration and throws the
    // whole editor away.
    const name = messageName(
      node('Sure — here is what we are asked most. 👇\n\nTap *See questions*.'),
    )

    // A lone surrogate is the bug; a whole emoji or no emoji are both fine.
    expect(name).not.toMatch(/[\uD800-\uDBFF](?![\uDC00-\uDFFF])/)
    expect(name).not.toMatch(/(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/)
    expect(name).not.toContain('\uFFFD')
  })

  it('counts characters rather than UTF-16 units', () => {
    // Forty emoji are forty characters, and eighty units. Cutting by units
    // would return half as many and look arbitrary.
    const name = messageName(node('🙂'.repeat(50)))
    expect([...name]).toHaveLength(41) // 40 plus the ellipsis
    expect(name.endsWith('…')).toBe(true)
  })

  it('leaves a short line alone', () => {
    expect(messageName(node('How can we help you today?'))).toBe('How can we help you today?')
  })

  it('strips WhatsApp formatting marks', () => {
    expect(messageName(node('*Bold* and _italic_'))).toBe('Bold and italic')
  })

  it('falls back to the key when there is nothing to read', () => {
    expect(messageName(node('   \n  '))).toBe('questions')
  })
})
