import type { CardLogo } from '@/components/landing/info-card'

/**
 * The real marks, as files under public/logos. Simple Icons (CC0) for most;
 * Sarvam's own wordmark, Delhivery's logo from Wikimedia Commons (public
 * domain) and BambuBuddy's app icon from its open-source repository.
 */
export const LOGOS = {
  shopify: { src: '/logos/shopify.svg', alt: 'Shopify' },
  bambubuddy: { src: '/logos/bambuddy.png', alt: 'BambuBuddy' },
  bambulab: { src: '/logos/bambulab.svg', alt: 'Bambu Lab' },
  delhivery: { src: '/logos/delhivery.png', alt: 'Delhivery', wide: true },
  whatsapp: { src: '/logos/whatsapp.svg', alt: 'WhatsApp' },
  sarvam: { src: '/logos/sarvam.svg', alt: 'Sarvam AI', wide: true },
  s3: { src: '/logos/amazons3.svg', alt: 'Amazon S3' },
  google: { src: '/logos/google.svg', alt: 'Google' },
  openscad: { src: '/logos/openscad.svg', alt: 'OpenSCAD' },
  postgresql: { src: '/logos/postgresql.svg', alt: 'PostgreSQL' },
  go: { src: '/logos/go.svg', alt: 'Go' },
  gin: { src: '/logos/gin.svg', alt: 'Gin' },
  nextjs: { src: '/logos/nextdotjs.svg', alt: 'Next.js' },
  react: { src: '/logos/react.svg', alt: 'React' },
  typescript: { src: '/logos/typescript.svg', alt: 'TypeScript' },
  tailwind: { src: '/logos/tailwindcss.svg', alt: 'Tailwind CSS' },
  zod: { src: '/logos/zod.svg', alt: 'Zod' },
  pnpm: { src: '/logos/pnpm.svg', alt: 'pnpm' },
  docker: { src: '/logos/docker.svg', alt: 'Docker' },
  vercel: { src: '/logos/vercel.svg', alt: 'Vercel' },
  caddy: { src: '/logos/caddy.svg', alt: 'Caddy' },
} satisfies Record<string, CardLogo>

export type LogoKey = keyof typeof LOGOS
