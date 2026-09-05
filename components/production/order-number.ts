/**
 * The customer's order number, taken from a job number.
 *
 * A job is named after the order it came from - "JOB-114652", or
 * "JOB-114652-2" for the second plank of the same order - so the order number is
 * the first run of digits in it. Mirrors orderNumberFromJobNumber in
 * Tensor-Core's batch_plate_name.go, which names the merged plate the same way.
 *
 * Falls back to the whole job number when there are no digits, so a
 * hand-created job still shows something a person can search for.
 */
export function orderNumberFromJobNumber(jobNumber: string): string {
  const match = /\d+/.exec(jobNumber)
  return match ? match[0] : jobNumber
}
