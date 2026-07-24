import { randomBytes } from 'node:crypto'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

// Logos live under /public for now; production will swap this for cloud object
// storage. Keep the accepted set tight and the size small.
const MAX_BYTES = 2 * 1024 * 1024 // 2 MB
const LOGO_DIR = join(process.cwd(), 'public', 'brand-logos')
const PUBLIC_PREFIX = '/brand-logos'

// SVG is intentionally excluded: it would need dangerouslyAllowSVG, which invites
// XSS from untrusted markup.
export const EXTENSION_BY_TYPE: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/webp': 'webp',
}

/** A client-caused rejection (bad type, empty, too large) — distinct from I/O errors. */
export class LogoStorageError extends Error {}

/**
 * Validates an image buffer against the accepted types and size, writes it under
 * /public/brand-logos, and returns its public URL. Throws LogoStorageError for a
 * bad image; lets I/O errors propagate for the caller to treat as a 500.
 */
export async function storeImageBuffer(buffer: Buffer, contentType: string): Promise<string> {
  const extension = EXTENSION_BY_TYPE[contentType]
  if (!extension) throw new LogoStorageError('Use a PNG, JPG or WebP image.')
  if (buffer.length === 0) throw new LogoStorageError('The file is empty.')
  if (buffer.length > MAX_BYTES) throw new LogoStorageError('The logo must be 2 MB or smaller.')

  const name = `${randomBytes(16).toString('hex')}.${extension}`
  await mkdir(LOGO_DIR, { recursive: true })
  await writeFile(join(LOGO_DIR, name), buffer)
  return `${PUBLIC_PREFIX}/${name}`
}
