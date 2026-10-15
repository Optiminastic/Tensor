import { describe, expect, it } from 'vitest'

import { reviewActions, type ReviewCaps } from './review-caps'

const ALL: ReviewCaps = { canSubmit: true, canApprove: true, canReject: true }
const NONE: ReviewCaps = { canSubmit: false, canApprove: false, canReject: false }

describe('reviewActions', () => {
  it('offers submit on a priced design that is not red', () => {
    expect(reviewActions('priced', 'green', ALL)).toEqual({
      submit: true,
      approve: false,
      sendBack: false,
    })
  })

  it('withholds submit on a red design', () => {
    expect(reviewActions('priced', 'red', ALL).submit).toBe(false)
  })

  it('offers approve and send back only while submitted', () => {
    expect(reviewActions('submitted', 'yellow', ALL)).toEqual({
      submit: false,
      approve: true,
      sendBack: true,
    })
    expect(reviewActions('approved', 'green', ALL).approve).toBe(false)
  })

  it('offers nothing without the role', () => {
    expect(reviewActions('submitted', 'green', NONE)).toEqual({
      submit: false,
      approve: false,
      sendBack: false,
    })
  })
})
