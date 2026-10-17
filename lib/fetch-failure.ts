/**
 * Why a call to Tensor-Core never came back, said accurately.
 *
 * WHY THIS EXISTS. Every service turned a thrown `fetch` into one sentence:
 * "Tensor-Core is unreachable. Is the backend running?" That is right for a
 * refused connection and wrong for everything else - and the commonest
 * everything-else is a TIMEOUT, where the backend is plainly running and
 * simply took longer than the budget.
 *
 * It cost a real investigation. The Agent Overview showed thirty calls,
 * their cost and the carts they recovered, with that banner above them: two
 * of its four requests had succeeded and the message ledger had timed out
 * after 8 seconds while fetching from Meta and Shopify. The banner sent the
 * reader to check whether the backend was up. It was up. Nothing on the page
 * pointed at the one endpoint that was slow.
 *
 * `AbortSignal.timeout` rejects with a DOMException named TimeoutError, which
 * is how the two are told apart.
 */
export function describeFetchFailure(error: unknown, seconds: number): string {
  if (error instanceof Error && error.name === 'TimeoutError') {
    return `That took longer than ${seconds} seconds, so we stopped waiting. The backend is up — this one request is slow.`
  }
  if (error instanceof Error && error.name === 'AbortError') {
    return 'That request was cancelled before it finished.'
  }
  return 'Tensor-Core is unreachable. Is the backend running?'
}
