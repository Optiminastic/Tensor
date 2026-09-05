import type { JSX } from 'react'

// How many orders a row shows before collapsing the rest into a count. A bed
// holds four planks, so four tags is the normal full row and this only bites on
// a hand-assembled batch - where the exact list matters less than not letting
// one row push every column after it off the screen.
const MAX_VISIBLE = 4

interface BatchOrderTagsProps {
  orderNumbers: string[]
}

/**
 * The Shopify orders on a bed, as tags.
 *
 * Grey rather than toned: these are identifiers, not statuses. A coloured chip
 * on this column would compete with the Status pill beside it and imply a
 * meaning the order number does not carry.
 */
export function BatchOrderTags({ orderNumbers }: BatchOrderTagsProps): JSX.Element {
  if (orderNumbers.length === 0) {
    return <span className="text-muted-foreground">—</span>
  }

  const visible = orderNumbers.slice(0, MAX_VISIBLE)
  const hidden = orderNumbers.length - visible.length

  return (
    <div className="flex max-w-56 flex-wrap items-center gap-1">
      {visible.map(number => (
        <span
          key={number}
          className="bg-surface-muted text-muted-foreground rounded px-1.5 py-0.5 font-mono text-xs whitespace-nowrap tabular-nums"
        >
          {number}
        </span>
      ))}
      {hidden > 0 ? (
        <span
          className="text-subtle-foreground text-xs"
          title={orderNumbers.slice(MAX_VISIBLE).join(', ')}
        >
          +{hidden}
        </span>
      ) : null}
    </div>
  )
}
