/**
 * The order a plank belongs to, as the floor refers to it.
 *
 * Prefer the order's own number, which the backend now sends. Reading it out
 * of the job number is the fallback, and was never more than a convention: an
 * imported job is numbered after its order, so JOB-115251 belongs to
 * T3DPS-115251 — but a job numbered from a sequence matched no order at all,
 * and a bed built to reprint somebody's plank was labelled for nobody.
 *
 * Reduced to digits so the column reads as it always has. The store prefix is
 * the same on every row here and says nothing that distinguishes one from the
 * next.
 */
export function orderNumberFor(orderNumber: string | null | undefined, jobNumber: string): string {
  const digits = /(\d+)\s*$/.exec(orderNumber ?? '')
  if (digits) return digits[1] ?? ''
  return orderNumberFromJobNumber(jobNumber)
}

/** The digits in a job number, as a last resort. */
export function orderNumberFromJobNumber(jobNumber: string): string {
  const match = /\d+/.exec(jobNumber)
  return match ? match[0] : jobNumber
}
