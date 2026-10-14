import { describe, expect, it } from 'vitest'

import { sendBackComment } from './send-back-comment'

describe('sendBackComment', () => {
  it('joins the reasons and the note', () => {
    expect(sendBackComment(['Cost too high', 'Print time too long'], '  Pack 4 per bed.  ')).toBe(
      'Reasons: Cost too high, Print time too long.\n\nPack 4 per bed.',
    )
  })

  it('works with only reasons or only a note', () => {
    expect(sendBackComment(['Geometry needs work'], '')).toBe('Reasons: Geometry needs work.')
    expect(sendBackComment([], 'Thicken the base')).toBe('Thicken the base')
  })

  it('is empty when there is nothing to send', () => {
    expect(sendBackComment([], '   ')).toBe('')
  })
})
