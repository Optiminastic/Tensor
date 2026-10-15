/** The reasons a reviewer can tick when sending a design back. */
export const SEND_BACK_REASONS = [
  'Cost too high',
  'Print time too long',
  'Geometry needs work',
  'Wrong material or colour',
  'Listing details',
] as const

export type SendBackReason = (typeof SEND_BACK_REASONS)[number]

/**
 * The comment the designer receives: the ticked reasons, then the note. The
 * backend requires a non-empty comment, so this returns "" when there is
 * nothing to say and the sheet keeps its button disabled.
 */
export function sendBackComment(reasons: readonly string[], note: string): string {
  const parts: string[] = []
  if (reasons.length > 0) parts.push(`Reasons: ${reasons.join(', ')}.`)
  const trimmed = note.trim()
  if (trimmed) parts.push(trimmed)
  return parts.join('\n\n')
}
