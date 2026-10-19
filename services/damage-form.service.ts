import { env } from '@/lib/env'
import { type DamageForm, DamageFormSchema } from '@/lib/validators/damage-form'

/**
 * The customer's own damage form, by the token in their link.
 *
 * NO BEARER TOKEN. Like the personalisation page, this is a call made on
 * behalf of somebody with no account: the random string in the URL is the
 * whole authority, and Tensor-Core refuses it the same way for expired,
 * closed and never-existed.
 *
 * Returns null for every refusal, so the page shows one sentence whatever the
 * cause - distinguishing them would tell somebody probing which of their
 * guesses was a real token.
 */
export async function fetchDamageForm(token: string): Promise<DamageForm | null> {
  try {
    const response = await fetch(
      `${env.TENSOR_CORE_URL}/public/damage/${encodeURIComponent(token)}`,
      { cache: 'no-store', signal: AbortSignal.timeout(8_000) },
    )
    if (!response.ok) return null
    return DamageFormSchema.parse(await response.json())
  } catch {
    return null
  }
}
