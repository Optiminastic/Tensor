import type { JSX } from 'react'

import type { PhotoSheetSummary } from '@/lib/validators/photo-sheet'

interface PhotoSheetSummaryNoteProps {
  summary: PhotoSheetSummary
}

/**
 * What the custom photo sheets hold: how many sheets and photos, how much of
 * each page the photos cover, and every order or photo left out with the
 * reason - an order with no photo product, a photo that would not download.
 */
export function PhotoSheetSummaryNote({ summary }: PhotoSheetSummaryNoteProps): JSX.Element {
  const used = (summary.utilisation ?? []).map(u => `${Math.round(u * 100)}%`)
  const skipped = summary.skipped ?? []
  return (
    <div className="flex flex-col gap-2 text-sm">
      <p>
        <span className="font-mono tabular-nums">{summary.photos}</span>{' '}
        {summary.photos === 1 ? 'photo' : 'photos'} on{' '}
        <span className="font-mono tabular-nums">{summary.sheets}</span> A4{' '}
        {summary.sheets === 1 ? 'sheet' : 'sheets'}
        {used.length > 0 ? (
          <span className="text-muted-foreground">
            {' '}
            (paper used: <span className="font-mono tabular-nums">{used.join(', ')}</span>)
          </span>
        ) : null}
      </p>
      {skipped.length > 0 ? (
        <div className="bg-warning-subtle rounded-2xl px-4 py-3">
          <p className="font-medium">Left out ({skipped.length})</p>
          <ul className="mt-1 list-disc pl-5">
            {skipped.map(s => (
              <li key={s} className="font-mono text-xs">
                {s}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  )
}
