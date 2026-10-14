import type { ShopifyImportSource, UploadFormValues } from './upload-schema'

interface BuildFormArgs {
  values: UploadFormValues
  file: File
  preview: File | null
  shopify?: ShopifyImportSource
  // Colours auto-detected from a 3MF, sent so the backend can keep the full
  // palette alongside the (length-capped) Colour field.
  detectedColours?: string[]
}

const OPTIONAL_TEXT = [
  'colour',
  'notes',
  'product_type',
  'personalisation_type',
  'add_ons',
  'packaging_type',
] as const

function appendShopify(form: FormData, shopify: ShopifyImportSource): void {
  form.set('shopify_product_gid', shopify.product_gid)
  form.set('shopify_handle', shopify.handle)
  form.set('shopify_admin_url', shopify.admin_url)
  form.set('shopify_min_price', shopify.min_price)
  form.set('shopify_max_price', shopify.max_price)
  form.set('shopify_currency', shopify.currency)
}

/**
 * The multipart body for an upload. Empty optional fields are left out. When
 * importing, the preview falls back to the Shopify photo URL and the listing
 * snapshot rides along.
 */
export function buildDesignFormData(args: BuildFormArgs): FormData {
  const { values, file, preview, shopify, detectedColours } = args
  const form = new FormData()
  form.set('name', values.name)
  form.set('material', values.material)
  form.set('finish', values.finish)
  form.set('units_per_bed', String(values.units_per_bed))
  form.set('quality', values.quality)
  form.set('infill_pct', String(values.infill_pct))
  for (const key of OPTIONAL_TEXT) if (values[key]) form.set(key, values[key])
  if (values.colour_count) form.set('colour_count', String(values.colour_count))
  form.set('left_nozzle_mm', String(values.left_nozzle_mm))
  form.set('right_nozzle_mm', String(values.right_nozzle_mm))
  form.set('left_flow', values.left_flow)
  form.set('right_flow', values.right_flow)
  if (detectedColours?.length) form.set('detected_colours', detectedColours.join(','))
  form.set('file', file)
  if (preview) form.set('preview', preview)
  else if (shopify?.image_url) form.set('preview_url', shopify.image_url)
  if (shopify) appendShopify(form, shopify)
  return form
}
