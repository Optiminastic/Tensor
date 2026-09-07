import type { JSX } from 'react'

// How many orders a row shows before collapsing the rest into a count. A bed
// holds four planks, so four tags is the normal full row and this only bites on
// a hand-assembled batch - where the exact list matters less than not letting
// one row push every column after it off the screen.
const MAX_VISIBLE = 4

interface BatchOrderTagsProps {
  orderNumbers: string[]
  /** Which of them paid for priority dispatch, tinted so a bed carrying one is
   *  recognisable without opening it. */
  priorityOrderNumbers?: string[]
}

/**
 * The Shopify orders on a bed, as tags.
 *
 * Grey rather than toned: these are identifiers, not statuses. A coloured chip
 * on this column would compete with the Status pill beside it and imply a
 * meaning the order number does not carry.
 *
 * The one exception is priority dispatch, which gets a light red ground. That
 * IS a property of the order rather than a status of the job, and it is the
 * reason this bed is ordered ahead of others - so an operator scanning the
 * column can see which plank on the plate is the one somebody paid to expedite.
 */
export function BatchOrderTags({
  orderNumbers,
  priorityOrderNumbers = [],
}: BatchOrderTagsProps): JSX.Element {
  if (orderNumbers.length === 0) {
    return <span className="text-muted-foreground">—</span>
  }

  const priority = new Set(priorityOrderNumbers)
  // Priority tags first within the row, so the four that fit are never the four
  // that happen to sort lowest while an expedited order hides under "+1".
  const ordered = [...orderNumbers].sort(
    (a, b) => Number(priority.has(b)) - Number(priority.has(a)),
  )
  const visible = ordered.slice(0, MAX_VISIBLE)
  const hidden = ordered.length - visible.length

  return (
    <div className="flex max-w-56 flex-wrap items-center gap-1">
      {visible.map(number => (
        <span
          key={number}
          className={
            priority.has(number)
              ? 'bg-danger-subtle text-danger rounded px-1.5 py-0.5 font-mono text-xs font-medium whitespace-nowrap tabular-nums'
              : 'bg-surface-muted text-muted-foreground rounded px-1.5 py-0.5 font-mono text-xs whitespace-nowrap tabular-nums'
          }
          title={priority.has(number) ? `${number} — priority dispatch` : number}
        >
          {number}
        </span>
      ))}
      {hidden > 0 ? (
        <span
          className="text-subtle-foreground text-xs"
          title={ordered.slice(MAX_VISIBLE).join(', ')}
        >
          +{hidden}
        </span>
      ) : null}
    </div>
  )
}
