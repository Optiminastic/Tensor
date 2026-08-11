/** batch id -> human batch number ("B-1042"), built by the page from the
 * batch list so the station queues can show which bed a job was printed on
 * without each row fetching its batch. */
export type BatchNumbers = Record<string, string>

/** The Batch cell's text for one job: its batch number when known, a short id
 * when the batch list wasn't readable (batch:read is a separate permission
 * from production:read), and an em dash for an unbatched job. */
export function batchLabel(batchId: string | null | undefined, numbers: BatchNumbers): string {
  if (!batchId) return '—'
  return numbers[batchId] ?? batchId.slice(0, 8)
}
