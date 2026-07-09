import type { Metadata } from 'next'
import { IBM_Plex_Mono, Inter } from 'next/font/google'
import type React from 'react'

import { QueryProvider } from '@/components/providers/query-provider'

import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
  preload: true,
})

const plexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-plex-mono',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'Tensor',
    template: '%s · Tensor',
  },
  description:
    'Tensor — 3D printing design costing and selling-price approval. Slicer-driven cost estimation, design pre-checks, and margin-safe pricing.',
}

export default function RootLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <html lang="en" className={`${inter.variable} ${plexMono.variable}`} suppressHydrationWarning>
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  )
}
