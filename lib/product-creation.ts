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
  /** The download beside the preview: the file the printer takes. */
  download: { format: 'pdf' | '3mf'; label: string }
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
]

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
