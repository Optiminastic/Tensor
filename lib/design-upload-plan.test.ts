import { describe, expect, it } from 'vitest'

import { planDesignUploads, skipReason } from '@/lib/design-upload-plan'

/** A File with only the part the plan reads. */
function named(name: string): File {
  return new File(['// scad'], name, { type: 'text/plain' })
}

function statuses(files: string[], existing: string[] = []): Record<string, string> {
  const plan = planDesignUploads(files.map(named), existing)
  return Object.fromEntries(plan.candidates.map(c => [c.fileName, c.status]))
}

describe('planDesignUploads', () => {
  it('files a folder of designs under their own names', () => {
    const plan = planDesignUploads(
      [named('pdhr-g.scad'), named('pdhr-p.scad'), named('pdhr-r.scad')],
      [],
    )
    expect(plan.ready.map(c => c.key)).toEqual(['pdhr-g', 'pdhr-p', 'pdhr-r'])
    expect(plan.skipped).toHaveLength(0)
  })

  // The endpoint treats a repeat key as a new VERSION of that template. Two
  // chosen files reducing to one key would therefore not be two designs: the
  // second would silently replace the first, and the table would show one row
  // where somebody chose two files.
  it('holds back a second file that would overwrite the first', () => {
    const plan = planDesignUploads([named('pwdh-p.scad'), named('PWDH-P.scad')], [])

    expect(plan.ready.map(c => c.fileName)).toEqual(['pwdh-p.scad'])
    expect(plan.skipped.map(c => c.status)).toEqual(['duplicate'])
    // The FIRST one chosen keeps the key, so the held-back file is the one
    // that would have overwritten something.
    expect(plan.skipped[0]?.fileName).toBe('PWDH-P.scad')
  })

  // The shop's live keys are hyphenated - pdhr-g, pwdh-w - so a fold to
  // underscores would miss them and file a silent duplicate beside each.
  it('recognises a key already in the table, hyphens and all', () => {
    expect(statuses(['pwdh-p.scad'], ['pwdh-p'])).toEqual({ 'pwdh-p.scad': 'taken' })
    expect(statuses(['PDHR-R.scad'], ['pdhr-r'])).toEqual({ 'PDHR-R.scad': 'taken' })
  })

  // Refusing nine files over one clash would mean re-picking the eight that
  // were fine, which is the manual effort this is meant to remove.
  it('lets the good files through when one is bad', () => {
    const plan = planDesignUploads(
      [named('a-one.scad'), named('pdhr-g.scad'), named('___.scad'), named('a-two.scad')],
      ['pdhr-g'],
    )
    expect(plan.ready.map(c => c.key)).toEqual(['a-one', 'a-two'])
    expect(plan.skipped.map(c => [c.fileName, c.status])).toEqual([
      ['pdhr-g.scad', 'taken'],
      ['___.scad', 'unusable'],
    ])
  })

  it('names a file whose name yields no key', () => {
    const plan = planDesignUploads([named('___.scad'), named('-.scad')], [])
    expect(plan.ready).toHaveLength(0)
    expect(plan.skipped.map(c => c.status)).toEqual(['unusable', 'unusable'])
  })

  it('keeps the chosen order, so the list reads as it was picked', () => {
    const plan = planDesignUploads([named('z-last.scad'), named('a-first.scad')], [])
    expect(plan.candidates.map(c => c.fileName)).toEqual(['z-last.scad', 'a-first.scad'])
  })

  // The shop exports the same drawing under a space and under a hyphen, and
  // those derive pwdh_p and pwdh-p - DISTINCT keys. Compared strictly, the
  // second uploads cleanly and sits beside the first: two rows for one
  // drawing, with nothing saying which a variant should link to.
  it('treats a separator as a separator when asking if it is already here', () => {
    expect(statuses(['PWDH P.scad'], ['pwdh-p'])).toEqual({ 'PWDH P.scad': 'taken' })
    expect(statuses(['pwdh-p.scad'], ['pwdh_p'])).toEqual({ 'pwdh-p.scad': 'taken' })

    const both = planDesignUploads([named('pwdh-p.scad'), named('PWDH P.scad')], [])
    expect(both.ready.map(c => c.fileName)).toEqual(['pwdh-p.scad'])
    expect(both.skipped.map(c => c.status)).toEqual(['duplicate'])
  })

  // ...but the key STORED stays faithful to the filename, because every live
  // Diwali key is hyphenated and a variant links to the exact string.
  it('stores the key the filename asked for', () => {
    const plan = planDesignUploads([named('pwdh-p.scad'), named('PWDH P.scad')], [])
    expect(plan.candidates.map(c => c.key)).toEqual(['pwdh-p', 'pwdh_p'])
  })

  it('says why each skipped file was skipped', () => {
    const plan = planDesignUploads(
      [named('pdhr-g.scad'), named('PDHR G.scad'), named('___.scad')],
      ['pdhr-g'],
    )
    const reasons = plan.skipped.map(c => skipReason(c))
    expect(reasons[0]).toContain('Replace')
    expect(reasons[1]).toContain('Replace')
    expect(reasons[2]).toContain('nothing in the name')
    // A ready file has nothing to explain.
    const [first] = plan.candidates
    expect(first).toBeDefined()
    if (first !== undefined) expect(skipReason({ ...first, status: 'ready' })).toBe('')
  })
})
