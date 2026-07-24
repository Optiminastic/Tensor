import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'
import type { Metadata } from 'next'
import localFont from 'next/font/local'
import type React from 'react'
import type { JSX } from 'react'

import { QueryProvider } from '@/components/providers/query-provider'

import './globals.css'

// Display only — page titles and editorial moments. Each file is variable
// across the whole weight axis and carries an optical-size axis, so
// `.text-display` gets display-tuned cuts at large sizes via
// `font-optical-sizing: auto` rather than a file per size. The italic is a
// real drawn face: `<em>` inside a display line is an editorial gesture, and
// without it the browser shears the upright into a synthetic oblique, which
// is plainly visible at display sizes.
// Self-hosted, SIL Open Font License — see ./fonts/MonaSans-OFL.txt.
const monaSans = localFont({
  src: [
    { path: './fonts/MonaSans-VF.woff2', weight: '200 900', style: 'normal' },
    { path: './fonts/MonaSans-Italic-VF.woff2', weight: '200 900', style: 'italic' },
  ],
  variable: '--font-mona-sans',
  display: 'swap',
  preload: true,
})

export const metadata: Metadata = {
  title: {
    default: 'Tensor',
    template: '%s · Tensor',
  },
  description:
    'Tensor — 3D printing design costing and selling-price approval. Slicer-driven cost estimation, design pre-checks, and margin-safe pricing.',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon.png', type: 'image/png', sizes: '48x48' },
    ],
    apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }): JSX.Element {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable} ${monaSans.variable}`}
      suppressHydrationWarning
    >
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  )
}
