import {
  RiBarChartBoxFill,
  RiGoogleFill,
  RiMetaFill,
  RiShoppingBag3Fill,
  RiTruckFill,
  RiWhatsappFill,
} from '@remixicon/react'
import type { JSX } from 'react'

import { cn } from '@/lib/utils'

interface ProviderLogoProps {
  provider: string
  className?: string
}

/**
 * The mark beside an integration's name.
 *
 * REAL BRAND MARKS WHERE THEY EXIST - Google, Meta and WhatsApp ship in
 * @remixicon/react and are the genuine logos. Shopify and Delhivery do not, so
 * they get a tinted glyph that reads as them rather than a path drawn from
 * memory: an almost-right logo looks worse than an honest icon, and a wrong
 * one misrepresents somebody else's trademark.
 *
 * Colour is doing the identifying here, which is the one place in this product
 * where a saturated colour is allowed to mean "brand" rather than "state" -
 * these are other companies' marks, and a row of grey glyphs is harder to scan
 * than the logos people already recognise.
 */
export function ProviderLogo({ provider, className }: ProviderLogoProps): JSX.Element {
  const size = cn('size-5 shrink-0', className)

  switch (provider) {
    case 'google_ads':
      return <RiGoogleFill className={cn(size, 'text-[#4285F4]')} aria-hidden />
    case 'google_analytics':
      return <RiBarChartBoxFill className={cn(size, 'text-[#E37400]')} aria-hidden />
    case 'meta_ads':
      return <RiMetaFill className={cn(size, 'text-[#0866FF]')} aria-hidden />
    case 'shopify':
      return <RiShoppingBag3Fill className={cn(size, 'text-[#5E8E3E]')} aria-hidden />
    case 'whatsapp':
      return <RiWhatsappFill className={cn(size, 'text-[#25D366]')} aria-hidden />
    case 'delhivery':
      // No public mark in the icon set, so a courier glyph in Delhivery's own
      // red rather than a logo drawn from memory: an almost-right logo looks
      // worse than an honest icon, and a wrong one misrepresents somebody
      // else's trademark.
      return <RiTruckFill className={cn(size, 'text-[#E3000F]')} aria-hidden />
    default:
      return <RiBarChartBoxFill className={cn(size, 'text-muted-foreground')} aria-hidden />
  }
}
