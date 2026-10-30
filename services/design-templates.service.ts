import { env } from '@/lib/env'
import { createLogger } from '@/lib/logger'
import {
  DesignTemplateSchema,
  type DesignTemplate,
  type TemplateParam,
  TemplateParamSchema,
} from '@/lib/validators/registry'
import {
  coreCall,
  coreHeaders,
  REGISTRY_READ_FAILED,
  RegistryServiceError,
} from '@/services/registry.service'

const log = createLogger('DesignTemplatesService')
const TIMEOUT_MS = 15_000

/**
 * The .scad files the registry holds: listing them, replacing one, reading the
 * variables one declares, and removing one.
 *
 * Split from the registry service, which had grown past the line limit, and
 * split along the right seam: a design file is not a registry product. It
 * borrows that module's client rather than opening a second one, so a refusal
 * from Tensor-Core reads the same whichever of the two asked for it.
 */

export async function listDesignTemplates(token: string): Promise<DesignTemplate[]> {
  return coreCall('/registry/templates', { headers: coreHeaders(token) }, data =>
    DesignTemplateSchema.array().parse(data),
  )
}

/**
 * Replaces the .scad a template key renders from.
 *
 * Multipart, so the Content-Type header is left for fetch to set with its own
 * boundary - jsonHeaders here would produce a body the backend cannot parse.
 */
export async function uploadDesignTemplate(
  token: string,
  key: string,
  form: FormData,
): Promise<DesignTemplate> {
  return coreCall(
    `/registry/templates/${encodeURIComponent(key)}`,
    { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form },
    data => DesignTemplateSchema.parse(data),
  )
}

/**
 * Streams the .scad a template key renders from.
 *
 * Returns the raw Response so a proxy route can pipe the body straight through
 * without buffering, the same shape as files.service.ts#fetchFile. The bearer
 * token is minted server-side, so the browser never handles it.
 *
 * Tensor-Core answers with what the RENDERER would use: the uploaded override
 * where one exists, the embedded copy otherwise. That is the point of
 * downloading it - a key nobody has replaced is exactly the one somebody needs
 * a copy of before they start editing.
 */
export async function fetchDesignTemplateFile(token: string, key: string): Promise<Response> {
  let response: Response
  try {
    response = await fetch(
      `${env.TENSOR_CORE_URL}/registry/templates/${encodeURIComponent(key)}/file`,
      {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
        signal: AbortSignal.timeout(TIMEOUT_MS),
      },
    )
  } catch (error) {
    log.error({ key, err: error }, 'Tensor-Core is unreachable')
    throw new RegistryServiceError('Tensor-Core is unreachable. Is the backend running?')
  }
  if (!response.ok) {
    const detail = await response
      .json()
      .then((body: { detail?: string }) => body.detail)
      .catch(() => undefined)
    log.warn({ key, status: response.status, detail }, 'Tensor-Core rejected the request')
    throw new RegistryServiceError(detail ?? `Request failed (${response.status})`)
  }
  return response
}

/**
 * The variables a template declares, read from the file a render would use.
 *
 * The right-hand side of the mapping editor. Resolved through the renderer
 * rather than the upload table, so what the dropdown offers is what actually
 * prints - the uploaded override where one exists, the embedded copy where
 * none does.
 */
export async function listTemplateParams(token: string, key: string): Promise<TemplateParam[]> {
  return coreCall(
    `/registry/templates/${encodeURIComponent(key)}/params`,
    { headers: coreHeaders(token) },
    data => TemplateParamSchema.array().parse(data),
  )
}

/**
 * Removes an uploaded design file from the registry.
 *
 * The backend refuses while any product still renders from it and says which
 * ones, so the caller shows that sentence rather than inventing one: a key is
 * referenced as TEXT, not by a foreign key, so nothing else would stop the
 * last file a product prints from disappearing.
 */
export async function deleteDesignTemplate(token: string, key: string): Promise<void> {
  await coreCall(
    `/registry/templates/${encodeURIComponent(key)}`,
    { method: 'DELETE', headers: coreHeaders(token) },
    () => undefined,
  )
}

/**
 * Files a design file under a heading on the Designs tab, or unfiles it with
 * an empty string.
 *
 * A LABEL, and the backend reads it nowhere else: what a file is FOR is
 * decided by which product links it and in which role. This only decides which
 * accordion the row appears in.
 */
export async function setTemplateSection(
  token: string,
  key: string,
  section: string,
): Promise<void> {
  try {
    await coreCall(
      `/registry/templates/${encodeURIComponent(key)}/section`,
      { method: 'PATCH', headers: coreHeaders(token), body: JSON.stringify({ section }) },
      () => undefined,
    )
  } catch (err) {
    // Nothing was loaded here, so the shared read wording would be a lie. A
    // 404 with no detail is the signature of an API running an older build -
    // which is exactly what happened the first time this shipped.
    if (err instanceof RegistryServiceError && err.message === REGISTRY_READ_FAILED) {
      throw new RegistryServiceError(
        'Could not file that design file. The API may be running an older build.',
      )
    }
    throw err
  }
}

/**
 * Marks a design file as stating its own colours, or stops it being one.
 *
 * The backend refuses a file that declares none - it would silently fall back
 * to the configured scheme and look like a flag doing nothing - and refuses
 * clearing one that nothing has pieces configured for. Both sentences come
 * back as they are.
 */
export async function setTemplateSelfColour(
  token: string,
  key: string,
  selfColoured: boolean,
): Promise<void> {
  await coreCall(
    `/registry/templates/${encodeURIComponent(key)}/self-colour`,
    {
      method: 'PATCH',
      headers: coreHeaders(token),
      body: JSON.stringify({ self_coloured: selfColoured }),
    },
    () => undefined,
  )
}
