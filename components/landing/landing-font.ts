import { Inter_Tight } from 'next/font/google'

/**
 * The landing page's display and body face, from the inspiration it is built
 * on. Scoped to the landing page: the dashboard keeps Mona Sans and Geist.
 * Inter Tight is OFL, served by Google Fonts and self-hosted by next/font.
 */
export const interTight = Inter_Tight({
  subsets: ['latin'],
  variable: '--font-inter-tight',
  display: 'swap',
})
