import { DesignFontSchema, type DesignFont } from '@/lib/validators/design-fonts'
import { coreCall } from '@/services/registry.service'

/**
 * Uploads one .ttf/.otf for design templates to use.
 *
 * Only needed when a .scad names a font family Tensor does not ship; the
 * backend refuses such a .scad and names the family. Multipart, so fetch sets
 * the Content-Type with its own boundary.
 */
export async function uploadDesignFont(token: string, form: FormData): Promise<DesignFont> {
  return coreCall(
    '/registry/fonts',
    { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form },
    data => DesignFontSchema.parse(data),
  )
}
