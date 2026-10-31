/**
 * The register's own clock.
 *
 * A sales register covers noon to noon IST - that is the shop's day, and the
 * window the backend computes in. Rendered in the browser's zone instead, a
 * send at 10:54 IST read as "05:24 am" on a machine set to UTC, which looks
 * like the scheduler firing in the middle of the night.
 *
 * So every time on this page is formatted in IST explicitly, whatever the
 * reader's laptop is set to. The figures describe the shop, not the viewer.
 */
export const REPORT_ZONE = 'Asia/Kolkata'
