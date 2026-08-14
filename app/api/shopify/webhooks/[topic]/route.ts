import { type NextRequest, NextResponse } from 'next/server'

import { env } from '@/lib/env'

export const runtime = 'nodejs'

// The mandatory GDPR compliance webhook topics we forward to Tensor-Core.
const ALLOWED_TOPICS = new Set(['customers-data-request', 'customers-redact', 'shop-redact'])

// Headers Shopify sends that the backend needs to authenticate and route the
// webhook. The HMAC is computed over the raw body, so the body must be forwarded
// byte-for-byte and this signature header passed through unchanged.
const FORWARDED_HEADERS = [
  'x-shopify-hmac-sha256',
  'x-shopify-shop-domain',
  'x-shopify-topic',
  'content-type',
]

/**
 * Bridges Shopify's mandatory compliance webhooks to Tensor-Core. Shopify POSTs
 * these server-to-server to the public app domain; the backend that verifies them
 * is not itself public, so this route forwards the exact raw body and signature
 * header to it and returns the backend's status verbatim.
 */
export async function POST(
  request: NextRequest,
  ctx: { params: Promise<{ topic: string }> },
): Promise<NextResponse> {
  const { topic } = await ctx.params
  if (!ALLOWED_TOPICS.has(topic)) {
    return new NextResponse('Not found', { status: 404 })
  }

  const raw = new Uint8Array(await request.arrayBuffer())
  const headers: Record<string, string> = {}
  for (const name of FORWARDED_HEADERS) {
    const value = request.headers.get(name)
    if (value) headers[name] = value
  }

  try {
    const res = await fetch(`${env.TENSOR_CORE_URL}/webhooks/shopify/${topic}`, {
      method: 'POST',
      headers,
      body: raw,
      cache: 'no-store',
    })
    const text = await res.text()
    return new NextResponse(text, {
      status: res.status,
      headers: { 'content-type': res.headers.get('content-type') ?? 'application/json' },
    })
  } catch {
    return new NextResponse('Bad gateway', { status: 502 })
  }
}
