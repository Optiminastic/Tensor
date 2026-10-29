'use client'

import { useRouter } from 'next/navigation'
import { useState, type JSX } from 'react'

import { setTemplateSectionAction } from '@/app/dashboard/[brand]/production/design-template-actions'
import { Select } from '@/components/ui/select'
import type { DesignTemplate } from '@/lib/validators/registry'

interface TemplateSectionSelectProps {
  brand: string
  template: DesignTemplate
  /** Where the row sits now, including the heading its use implies. */
  effective: string
}

/**
 * Which heading a design file is filed under.
 *
 * A LABEL, AND IT CHANGES NOTHING ELSE. What a file is FOR is decided by which
 * product links it and in which role, and that is set on the product. This
 * sorts the list, so a shelf of .scad files can be told apart at a glance.
 *
 * The distinction is worth keeping sharp: an earlier version of this control
 * assigned the file to a product, which made "tidy the list" and "change what
 * prints" the same gesture - and the second is not something to do by accident
 * from a file browser.
 *
 * "Automatic" is a real choice rather than a blank: it files the row under
 * whatever its actual use implies, which is right for every correctly wired
 * file and needs no maintenance. Choosing a heading pins it to that one.
 */
export function TemplateSectionSelect({
  brand,
  template,
  effective,
}: TemplateSectionSelectProps): JSX.Element {
  const router = useRouter()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // The saved label, or '' for automatic. Held locally so the dropdown moves
  // under the pointer rather than after the round trip.
  const [value, setValue] = useState(template.section ?? '')

  async function choose(next: string): Promise<void> {
    const previous = value
    setValue(next)
    setBusy(true)
    setError(null)
    const res = await setTemplateSectionAction(brand, template.key, next)
    setBusy(false)
    if (!res.ok) {
      setValue(previous)
      setError(res.error ?? 'Could not file that file.')
      return
    }
    router.refresh()
  }

  return (
    <div className="flex flex-col gap-1">
      {/* SHORTER THAN A FULL CONTROL. One of these sits in every row, and a
          column of ten-high selects turns a dense table into a form. */}
      <Select
        value={value}
        disabled={busy}
        aria-label={`Section for ${template.key}`}
        className="h-8 w-40 rounded-lg text-xs"
        onChange={e => void choose(e.target.value)}
      >
        <option value="">Automatic — {SECTION_WORDS[effective] ?? 'other'}</option>
        <option value="print">Printing</option>
        <option value="preview">Preview</option>
        <option value="other">Other</option>
      </Select>
      {error ? (
        <span role="alert" className="text-danger text-xs text-pretty">
          {error}
        </span>
      ) : null}
    </div>
  )
}

const SECTION_WORDS: Record<string, string> = {
  print: 'printing',
  preview: 'preview',
  other: 'other',
}
