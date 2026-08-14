import type { JSX } from 'react'

import type { ModelInspection } from './model-colours'

interface ModelFormatNoticeProps {
  // The result of inspecting the picked file, or null when none is picked.
  inspection: ModelInspection | null
  // True while the file is being read/inspected.
  loading: boolean
}

const FORMAT_LABEL: Record<ModelInspection['format'], string> = {
  stl: 'STL',
  '3mf': '3MF',
  step: 'STEP',
  unknown: 'Unknown format',
}

/**
 * A one-line read-out under the model file input: the auto-detected format and,
 * for a 3MF, the colours found in it as swatches. Reassures the designer that the
 * right format and its colours were picked up on import.
 */
export function ModelFormatNotice({
  inspection,
  loading,
}: ModelFormatNoticeProps): JSX.Element | null {
  if (loading) {
    return <p className="text-muted-foreground text-xs">Detecting format…</p>
  }
  if (!inspection) {
    return null
  }

  const { format, colours } = inspection
  return (
    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
      <span className="text-foreground font-medium">Detected: {FORMAT_LABEL[format]}</span>
      {format === '3mf' && colours.length > 0 ? (
        <>
          <span className="text-muted-foreground">
            {colours.length} {colours.length === 1 ? 'colour' : 'colours'}
          </span>
          <span className="flex items-center gap-1">
            {colours.map(hex => (
              <span
                key={hex}
                title={hex}
                aria-label={hex}
                style={{ backgroundColor: hex }}
                className="border-border size-4 rounded-full border"
              />
            ))}
          </span>
        </>
      ) : (
        <span className="text-muted-foreground">
          {format === '3mf' ? 'no colour data' : 'no colour data (STL/STEP)'}
        </span>
      )}
    </div>
  )
}
