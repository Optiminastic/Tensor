/**
 * The custom values that differ from what the row held - a cleared field is
 * sent as "", which removes it. Untouched fields are not sent at all.
 */
export function changedCustomValues(
  original: Record<string, string> | undefined,
  draft: Record<string, string>,
): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [column, value] of Object.entries(draft)) {
    if (value.trim() !== (original?.[column] ?? '')) out[column] = value.trim()
  }
  return out
}
