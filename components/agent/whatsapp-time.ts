/** A message time as the inbox shows it: "13 Oct, 2:05 pm", in the viewer's zone. */
export function messageTime(raw: string): string {
  if (!raw) return ''
  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) return raw
  return parsed.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  })
}

/** A WhatsApp id (919876543210) shown as a number a person would dial. */
export function displayNumber(waId: string): string {
  return waId.startsWith('91') && waId.length === 12
    ? `+91 ${waId.slice(2, 7)} ${waId.slice(7)}`
    : `+${waId}`
}
