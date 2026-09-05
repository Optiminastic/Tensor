import type { JSX } from 'react'

interface BatchColourDotsProps {
  colours: { name: string; hex: string }[]
}

/**
 * The filament colours on a bed, as swatches.
 *
 * A circle rather than a chip because an operator recognises a colour far faster
 * than they read one, and this column exists to be scanned down rather than
 * read. The name is still reachable on hover and by a screen reader — the swatch
 * is the shorthand, not the only record.
 */
export function BatchColourDots({ colours }: BatchColourDotsProps): JSX.Element {
  if (colours.length === 0) {
    return <span className="text-muted-foreground">—</span>
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {colours.map(({ name, hex }) =>
        hex ? (
          <span
            key={name}
            // A ring rather than a border: white and ivory are real filament
            // colours and would otherwise vanish against a light row.
            className="ring-border size-3.5 rounded-full ring-1"
            style={{ backgroundColor: hex }}
            title={`${name} (${hex})`}
          >
            <span className="sr-only">{name}</span>
          </span>
        ) : (
          // No swatch to draw. Showing the name keeps a colour the filament
          // shelf has never heard of visible instead of silently absent.
          <span
            key={name}
            className="bg-surface-muted text-muted-foreground rounded px-1.5 py-0.5 text-[10px] whitespace-nowrap uppercase"
            title={`${name} — no swatch on the filament shelf`}
          >
            {name}
          </span>
        ),
      )}
    </div>
  )
}
