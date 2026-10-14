import { describe, expect, it } from 'vitest'

import { resolveActiveHref } from './nav-config'

const BASE = '/dashboard/acme'
const DESIGN_HREFS = [
  `${BASE}/designs`,
  `${BASE}/designs?view=drafts`,
  `${BASE}/designs?view=submitted`,
]

describe('resolveActiveHref', () => {
  it('picks the view-specific item when the view matches', () => {
    expect(resolveActiveHref(`${BASE}/designs`, 'submitted', DESIGN_HREFS)).toBe(
      `${BASE}/designs?view=submitted`,
    )
  })

  it('falls back to the plain item when no view is set', () => {
    expect(resolveActiveHref(`${BASE}/designs`, null, DESIGN_HREFS)).toBe(`${BASE}/designs`)
  })

  it('keeps the plain item active on a detail page beneath it', () => {
    expect(resolveActiveHref(`${BASE}/designs/123`, null, DESIGN_HREFS)).toBe(`${BASE}/designs`)
  })
})
