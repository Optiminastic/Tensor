import path from 'node:path'
import { fileURLToPath } from 'node:url'

import dotenv from 'dotenv'
dotenv.config({ path: './env/local.env' })

/** @type {import('next').NextConfig} */

// This directory, not wherever Next guesses. Next walks up looking for a
// lockfile to infer the workspace root, and on this machine it walks clear out
// of the repo and finds a stray package-lock.json in the home directory —
// which makes it resolve modules against the wrong root and fail the build.
const projectRoot = path.dirname(fileURLToPath(import.meta.url))

// In dev, Next blocks cross-origin requests to its own resources unless the host
// is allow-listed. When the app is reached through a tunnel (e.g. ngrok for
// Shopify OAuth), NEXT_PUBLIC_APP_URL is that tunnel host, so allow it.
const devOrigins = []
try {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  if (appUrl) devOrigins.push(new URL(appUrl).host)
} catch {
  // Ignore a malformed URL; the default same-origin policy still applies.
}

// Extra hosts, comma-separated, for a tunnel that is NOT the app URL.
//
// NEXT_PUBLIC_APP_URL cannot just be repointed at a tunnel: it is also the
// base of every OAuth redirect URI (Google, Shopify), and those are
// registered with the provider. So a tunnel used for something else - a
// WhatsApp link opened on a phone, a webhook - needs its own entry.
//
// WORTH KNOWING HOW THIS FAILS. A blocked origin does not error: Next
// refuses to serve its own /_next/* dev resources, the HTML still renders,
// and React never hydrates. Every handler is simply absent, which on screen
// looks like "the button does nothing" and leaves no trace in the browser
// console - only one line in the dev server's own output. It cost an
// afternoon on the damage form.
for (const host of (process.env.ALLOWED_DEV_ORIGINS ?? '').split(',')) {
  const trimmed = host.trim()
  if (trimmed) devOrigins.push(trimmed)
}

// Headers applied to every response. Tune CSP for your asset/CDN/auth setup.
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
]

const nextConfig = {
  turbopack: {
    root: projectRoot,
  },
  allowedDevOrigins: devOrigins,
  reactStrictMode: true,
  poweredByHeader: false,
  // Next's own type-checker runs in a jest-worker child process to isolate
  // the TS compiler's heap - on this machine (Node 24 + Next 16 + Windows)
  // that worker reliably crashes with STATUS_STACK_OVERFLOW, surfacing as a
  // "Jest worker encountered N child process exceptions" dev-overlay error
  // that has nothing to do with the page being viewed. `pnpm type-check`
  // (tsc --noEmit, run separately - see package.json's build script and
  // CLAUDE.md) is the actual type-safety gate, so this isn't a coverage gap.
  typescript: {
    ignoreBuildErrors: true,
  },
  // STL/3MF/STEP uploads flow through the design upload server action, so its
  // body limit must clear the backend's 60 MB model + 10 MB preview caps (default
  // is 1 MB). Headroom covers multipart encoding overhead.
  experimental: {
    serverActions: {
      bodySizeLimit: '80mb',
    },
    // The auth middleware also sees the request body, and Next caps THAT at 10 MB
    // by default - so a large STL + preview is truncated mid-stream and the form
    // parse throws "Unexpected end of form". Raise it past the upload size.
    // (`proxyClientMaxBodySize` is the current key; it replaces the deprecated
    // `middlewareClientMaxBodySize` and the two cannot both be set.)
    proxyClientMaxBodySize: '80mb',
  },
  images: {
    unoptimized: true,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
}

export default nextConfig
