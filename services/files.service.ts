// Server-only by placement (called from the /api/files/[id] proxy route).
import { env } from '@/lib/env'
import { createLogger } from '@/lib/logger'

const log = createLogger('FileService')
const FILE_TIMEOUT_MS = 30_000

/**
 * Typed client for Tensor-Core's generic /files/:id endpoint - the same
 * file_assets-backed store used for design STLs, batch merged plates, and a
 * production job's own print file.
 */
export class FileServiceError extends Error {}

// fetchFile streams a stored file's raw bytes. Returns the raw Response so a
// proxy route can pipe the body straight through without buffering, same
// pattern as batches.service.ts#fetchBatchPreview.
/**
 * @param preview asks Tensor-Core for a form a browser can draw rather than
 *   the stored bytes. A slicer writes colour in its own config files, where
 *   three.js never looks, so a designer's 3MF renders grey without this. The
 *   download link must NOT pass it: an operator taking the print file to a
 *   slicer has to get exactly what was uploaded.
 */
export async function fetchFile(token: string, id: string, preview = false): Promise<Response> {
  const query = preview ? '?preview=1' : ''
  let response: Response
  try {
    response = await fetch(`${env.TENSOR_CORE_URL}/files/${encodeURIComponent(id)}${query}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: 'no-store',
      signal: AbortSignal.timeout(FILE_TIMEOUT_MS),
    })
  } catch (error) {
    log.error({ id, err: error }, 'Tensor-Core is unreachable')
    throw new FileServiceError('Tensor-Core is unreachable. Is the backend running?')
  }
  if (!response.ok) {
    const detail = await response
      .json()
      .then((body: { detail?: string }) => body.detail)
      .catch(() => undefined)
    log.warn({ id, status: response.status, detail }, 'Tensor-Core rejected the request')
    throw new FileServiceError(detail ?? `Request failed (${response.status})`)
  }
  return response
}
