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

/**
 * Which of a batch's two failure points is the one to report, if either.
 *
 * Slice comes first when both are set: without a print file the queue error is
 * a consequence, and telling an operator to retry the send would waste their
 * time on a batch that has nothing to send.
 */
export function batchFailure(batch: {
  sliceError: string | null
  printError: string | null
}): { label: string; reason: string } | null {
  if (batch.sliceError) return { label: 'Slice failed', reason: batch.sliceError }
  if (batch.printError) return { label: 'Not sent', reason: batch.printError }
  return null
}
