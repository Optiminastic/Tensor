import { z } from 'zod'

/**
 * One credential an admin fills in.
 *
 * The form is built from this rather than written twice: a field added on the
 * backend appears here, is validated on save and is read by the client, with
 * no third place to forget.
 */
export const SettingFieldSchema = z.object({
  key: z.string(),
  label: z.string(),
  /** Where to find this value. Most are opaque ids from somebody else's console. */
  help: z.string(),
  /** Sealed at rest and never returned — only whether it is set. */
  secret: z.boolean(),
  required: z.boolean(),
  /**
   * What the running code uses when this setting is blank. The form pre-fills
   * it, so an optional field never renders as an empty box beside a Connected
   * badge. Never set on a secret.
   */
  default: z.string().default(''),
})

export const IntegrationSchema = z.object({
  provider: z.string(),
  label: z.string(),
  summary: z.string(),
  fields: z.array(SettingFieldSchema).nullable().default([]),
  /** False for a provider whose backend does not exist yet. */
  available: z.boolean(),
  connected: z.boolean(),
  /**
   * Every setting this brand has, secrets included - unsealed on the way out.
   *
   * NULLABLE, like `fields`. A Go nil map and a Go nil slice both marshal to
   * `null`, not to `{}` or `[]`, and `.default()` only fires on `undefined` -
   * so a bare `.default({})` throws on the very payload it was meant to
   * tolerate. The backend happens to send both initialised today; one early
   * return on the environment-fallback path is all it would take.
   */
  values: z
    .record(z.string(), z.string())
    .nullish()
    .transform(v => v ?? {}),
  /** Which of them are secret, so the form knows to mask them. */
  secrets_set: z
    .array(z.string())
    .nullish()
    .transform(v => v ?? []),
  /**
   * These came from the process's environment, not from this page.
   *
   * Worth showing: the form is pre-filled either way, so without it an admin
   * cannot tell whether they are editing a stored setting or overriding a
   * deployment - and Save does different things in those two cases.
   */
  from_environment: z.boolean().default(false),
})

export const IntegrationsResponseSchema = z.object({ items: z.array(IntegrationSchema) })

export type SettingField = z.infer<typeof SettingFieldSchema>
export type Integration = z.infer<typeof IntegrationSchema>
