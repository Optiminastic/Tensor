import { describe, expect, it } from 'vitest'

import {
  WhatsAppReplySchema,
  WhatsAppThreadResponseSchema,
  WhatsAppConversationsResponseSchema,
} from './whatsapp-inbox'

describe('WhatsApp inbox responses', () => {
  it('parses the conversation list Tensor-Core returns', () => {
    const parsed = WhatsAppConversationsResponseSchema.parse({
      items: [
        {
          wa_id: '919876543210',
          profile_name: 'Asha',
          mode: 'human',
          opted_out: false,
          can_reply: true,
          last_customer_at: '2026-10-13T08:45:18Z',
          last_message_at: null,
          last_message_preview: 'Is my plank ready?',
        },
      ],
    })
    expect(parsed.items[0]?.last_message_at).toBe('')
    expect(parsed.items[0]?.mode).toBe('human')
  })

  it('parses a thread with customer, bot and staff messages', () => {
    const message = (author: string, direction: string): Record<string, unknown> => ({
      id: author,
      direction,
      author,
      kind: 'text',
      body: 'hello',
      status: '',
      error_code: null,
      created_at: '2026-10-13T08:45:18Z',
    })
    const parsed = WhatsAppThreadResponseSchema.parse({
      conversation: {
        wa_id: '919876543210',
        profile_name: '',
        mode: 'bot',
        opted_out: false,
        can_reply: false,
        last_message_preview: '',
      },
      items: [message('customer', 'in'), message('bot', 'out'), message('staff', 'echo')],
    })
    expect(parsed.items.map(m => m.author)).toEqual(['customer', 'bot', 'staff'])
  })
})

describe('WhatsApp reply input', () => {
  const valid = { brand: 'the-3d-printing-store-india', waId: '919876543210', text: ' Hi! ' }

  it('trims the reply', () => {
    expect(WhatsAppReplySchema.parse(valid).text).toBe('Hi!')
  })

  it('refuses an empty reply, an over-long one, and a number that is not one', () => {
    expect(WhatsAppReplySchema.safeParse({ ...valid, text: '   ' }).success).toBe(false)
    expect(WhatsAppReplySchema.safeParse({ ...valid, text: 'x'.repeat(4097) }).success).toBe(false)
    expect(WhatsAppReplySchema.safeParse({ ...valid, waId: '../admin' }).success).toBe(false)
  })
})
