import { describe, expect, it } from 'vitest'

import { displayNumber, messageTime } from './whatsapp-time'

describe('displayNumber', () => {
  it('spaces an Indian mobile the way people write it', () => {
    expect(displayNumber('919113994682')).toBe('+91 91139 94682')
  })

  it('leaves other countries as a plain international number', () => {
    expect(displayNumber('14155550100')).toBe('+14155550100')
  })
})

describe('messageTime', () => {
  it('is empty for no time and passes through what it cannot parse', () => {
    expect(messageTime('')).toBe('')
    expect(messageTime('not a date')).toBe('not a date')
  })

  it('formats a real time', () => {
    expect(messageTime('2026-10-13T08:45:18Z')).toMatch(/Oct/)
  })
})
