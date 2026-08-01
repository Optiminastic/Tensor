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
