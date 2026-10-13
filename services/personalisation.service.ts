import { env } from '@/lib/env'
import {
  type PersonalisationLink,
  PersonalisationLinkSchema,
} from '@/lib/validators/personalisation'

/**
 * The customer's own order, by the token in their link.
 *
 * NO BEARER TOKEN. This is the one call in the app made on behalf of somebody
 * with no account: the random string in the URL is the whole authority, and
 * Tensor-Core refuses it the same way for expired, confirmed and never-existed.
 *
 * Returns null for every refusal, so the page shows one sentence whatever the
 * cause - distinguishing them would tell somebody probing which of their
 * guesses was a real token.
 */
export async function fetchPersonalisationLink(token: string): Promise<PersonalisationLink | null> {
  try {
    const response = await fetch(
      `${env.TENSOR_CORE_URL}/public/personalisation/${encodeURIComponent(token)}`,
      { cache: 'no-store', signal: AbortSignal.timeout(8_000) },
    )
    if (!response.ok) return null
    return PersonalisationLinkSchema.parse(await response.json())
  } catch {
    return null
  }
}
