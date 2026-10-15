import type { DesignAttributes, DesignDetail } from '@/lib/validators/designs'

/** How the design is printed: material, quality, batching, infill. */
export function printSpecs(design: DesignDetail): string[] {
  return [
    design.material,
    design.colour ?? '',
    design.quality,
    `${design.units_per_bed} per bed`,
    `${design.infill_pct}% infill`,
  ]
}

/** What the product is, from the optional upload metadata. */
export function productSpecs(attributes: DesignAttributes | null | undefined): string[] {
  if (!attributes) return []
  return [
    attributes.product_type ?? '',
    attributes.personalisation_type ? `Personalised: ${attributes.personalisation_type}` : '',
    attributes.colour_count ? `${attributes.colour_count} colours` : '',
    ...(attributes.add_ons ?? []),
    attributes.packaging_type ? `Packed in ${attributes.packaging_type}` : '',
  ]
}
