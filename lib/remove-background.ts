// Client-only helper: strips the background from a user-uploaded preview image so
// the Designs gallery reads like a clean product catalog. It runs an on-device
// model (@imgly/background-removal, ONNX/wasm) - the image never leaves the
// browser - and is imported dynamically so its wasm/model code stays out of the
// main bundle and only loads when someone actually uploads a preview.

// Cap the longest edge of the cut-out. A transparent PNG of a full-resolution
// photo can balloon past the upload limit; a gallery cover never needs more.
const MAX_DIMENSION = 1600

/**
 * Removes the background from an image file and returns a transparent PNG, scaled
 * down to a gallery-friendly size. Throws if the model fails; callers decide
 * whether to fall back to the original image.
 */
export async function removeImageBackground(file: File): Promise<File> {
  const { removeBackground } = await import('@imgly/background-removal')
  const cutout = await removeBackground(file)
  return normalisePng(cutout, file.name)
}

/** Draws the cut-out onto a right-sized canvas and re-encodes it as a PNG File. */
async function normalisePng(blob: Blob, sourceName: string): Promise<File> {
  const bitmap = await createImageBitmap(blob)
  const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height))
  const width = Math.round(bitmap.width * scale)
  const height = Math.round(bitmap.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) return new File([blob], toPngName(sourceName), { type: 'image/png' })

  ctx.drawImage(bitmap, 0, 0, width, height)
  bitmap.close()
  const out = await canvasToBlob(canvas)
  return new File([out], toPngName(sourceName), { type: 'image/png' })
}

/** Promise wrapper around the callback-based canvas.toBlob. */
function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      blob => (blob ? resolve(blob) : reject(new Error('Could not encode the image.'))),
      'image/png',
    )
  })
}

/** Swaps any file extension for .png (the cut-out is always a PNG). */
function toPngName(name: string): string {
  return `${name.replace(/\.[^./\\]+$/, '')}.png`
}
