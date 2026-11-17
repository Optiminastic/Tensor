/**
 * The products the Product Creation page can build from an order.
 *
 * Each names its backend endpoint, the file shown as a preview (always a PNG,
 * because looking at it is the check before printing) and the file the floor
 * actually prints from.
 */
export interface CreatableProduct {
  value: string
  label: string
  hint: string
  /**
   * The download beside the preview: the file the printer takes. background
   * means it is built on the production worker - started, polled, then
   * downloaded - because it takes OpenSCAD seconds rather than milliseconds.
   */
  download: { format: 'pdf' | '3mf'; label: string; background?: boolean }
  /**
   * buildFirst: the picture can only be drawn from the finished model, so
   * Submit starts the background build and the preview comes with the file.
   */
  buildFirst?: boolean
  /**
   * parts: a product that prints as several files offers each on its own
   * beside the download, which then holds all of them.
   */
  parts?: readonly { value: string; label: string }[]
  /** Shown above the preview. */
  check: string
}

export const CREATABLE_PRODUCTS: readonly CreatableProduct[] = [
  {
    value: 'dnp-photo-frame',
    label: 'DNPF Photo Frame',
    hint: 'Uses the order’s LEFT PHOTO and RIGHT PHOTO: each is cut into 9 strips and interleaved on an A4 page.',
    download: { format: 'pdf', label: 'Download print PDF' },
    check: 'check both faces before printing.',
  },
  {
    value: 'night-lamp',
    label: 'Night Lamp (Moon)',
    hint: 'Uses the order’s photo (file-1) and text (text-moon): the photo on a moon, the text on both sides, printed as a lithophane sphere.',
    download: { format: '3mf', label: 'Download 3MF model' },
    check: 'this is the lamp lit, unrolled - the photo faces front.',
  },
  {
    value: 'moon-lamp',
    label: '3D Moon Lamp (4 / 5 / 6 inch)',
    hint: 'Size from the SKU: 3DMS01-4P / -5P / -6P. Photo (file-1) and text (text-moon) on the moon; the 3MF has the top, the glue-on cap and both stands on one Bambu plate.',
    download: { format: '3mf', label: 'Build 3MF', background: true },
    check: 'this is the moon lit, unrolled - the photo faces front, above the cap seam.',
  },
  {
    value: 'pdnp-front-text',
    label: 'Premium DNP Front Text',
    hint: 'Uses only the order’s front text (STEP 6 - Front Text), inlaid in Arial Bold on the 192.8 mm front plate. The 3MF has the plate and the text as two colours.',
    download: { format: '3mf', label: 'Download 3MF', background: true },
    buildFirst: true,
    check: 'check the spelling of the front text before printing.',
  },
  {
    value: 'soulmate-combo',
    label: 'Soulmate Combo (plank + rose + keychain)',
    hint: 'Three coloured 3MFs from the order: the Dual Name Plank (single heart, letters in the order’s colour, STEP 1–3), the 3D Rose (STEP 4) and the Heart Keychain (STEP 5) in their own colours.',
    download: { format: '3mf', label: 'Download all (ZIP)', background: true },
    buildFirst: true,
    parts: [
      { value: 'plank', label: 'Plank' },
      { value: 'rose', label: 'Rose' },
      { value: 'keychain', label: 'Keychain' },
    ],
    check: 'plank, rose and keychain - check every name before printing.',
  },
  {
    value: 'duo-snap',
    label: 'Duo Snap',
    hint: 'Uses only the order’s TOP NAME, BOTTOM NAME and colour: the two names joined by “&”, outlined and framed in the colour bought, letters in white. The photo is not used.',
    download: { format: '3mf', label: 'Download 3MF', background: true },
    buildFirst: true,
    check: 'the display side, letters up - check both names before printing.',
  },
]

export type ProductBuild = {
  id: string
  status: 'queued' | 'building' | 'done' | 'failed'
  filename?: string
  error?: string
}

async function buildRequest(
  url: string,
  init?: RequestInit,
): Promise<ProductBuild | { error: string }> {
  const res = await fetch(url, { cache: 'no-store', ...init })
  const payload = (await res.json().catch(() => ({}))) as ProductBuild & { detail?: string }
  return res.ok ? payload : { error: payload.detail ?? 'Could not reach the build.' }
}

/** Starts a background build of a product's print file, or finds the one already made. */
export function startProductBuild(
  brand: string,
  product: string,
  orderNumber: string,
): Promise<ProductBuild | { error: string }> {
  return buildRequest(
    `/api/product-creation/${encodeURIComponent(brand)}/${encodeURIComponent(product)}/builds`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order_number: orderNumber, format: '3mf' }),
    },
  )
}

/** A background build's current state. */
export function readProductBuild(
  brand: string,
  id: string,
): Promise<ProductBuild | { error: string }> {
  return buildRequest(
    `/api/product-creation/${encodeURIComponent(brand)}/builds/${encodeURIComponent(id)}`,
  )
}

/** Where a finished build downloads from. */
export function productBuildFileUrl(brand: string, id: string): string {
  return `/api/product-creation/${encodeURIComponent(brand)}/builds/${encodeURIComponent(id)}/file`
}

export type BuildResult = { blob: Blob; filename: string } | { error: string }

/** Asks the backend for one file of one product for one order. */
export async function buildProductFile(
  brand: string,
  product: string,
  body: { order_number: string; format: string },
): Promise<BuildResult> {
  const res = await fetch(
    `/api/product-creation/${encodeURIComponent(brand)}/${encodeURIComponent(product)}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) },
  )
  if (!res.ok) {
    const payload = (await res.json().catch(() => ({}))) as { detail?: string }
    return { error: payload.detail ?? 'Could not build the file.' }
  }
  const disposition = res.headers.get('Content-Disposition') ?? ''
  const filename = /filename="?([^";]+)"?/.exec(disposition)?.[1] ?? `${product}.${body.format}`
  return { blob: await res.blob(), filename }
}

/** Saves a blob through the browser's own download. */
export function saveBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

/** The preview PNG drawn from a finished build's model. */
export function productBuildPreviewUrl(brand: string, id: string): string {
  return `/api/product-creation/${encodeURIComponent(brand)}/builds/${encodeURIComponent(id)}/preview`
}

/** Where one file of a multi-file build downloads from. */
export function productBuildPartUrl(brand: string, id: string, part: string): string {
  return `/api/product-creation/${encodeURIComponent(brand)}/builds/${encodeURIComponent(id)}/parts/${encodeURIComponent(part)}`
}
