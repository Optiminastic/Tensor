import type { NextRequest } from 'next/server'

import { env } from '@/lib/env'

interface RouteContext {
  params: Promise<{ token: string }>
}

/**
 * How long one upload may take, end to end.
 *
 * Generous on purpose. A 25 MB video from a phone on 2 Mbit is about two
 * minutes of actual transfer, and cutting it off at the usual eight seconds
 * would fail every video on the first try - the whole reason files go up one
 * at a time rather than in one multipart.
 */
const UPLOAD_TIMEOUT_MS = 10 * 60 * 1000

/**
 * One file on its way to the damage form.
 *
 * THE BODY IS STREAMED, NOT PARSED. Reading the multipart here to rebuild it
 * would hold the whole file in this process's memory for no gain: nothing in
 * Next needs to see inside it, and Tensor-Core parses it anyway. `duplex`
 * is required by the Fetch spec for a streaming request body and is not yet
 * in the DOM types, hence the cast.
 */
export async function POST(request: NextRequest, { params }: RouteContext): Promise<Response> {
  const { token } = await params
  const upstream = await fetch(
    `${env.TENSOR_CORE_URL}/public/damage/${encodeURIComponent(token)}/files`,
    {
      method: 'POST',
      // Carried through so the far end can find the multipart boundary.
      headers: {
        'Content-Type': request.headers.get('Content-Type') ?? 'application/octet-stream',
      },
      body: request.body,
      duplex: 'half',
      cache: 'no-store',
      signal: AbortSignal.timeout(UPLOAD_TIMEOUT_MS),
    } as RequestInit & { duplex: 'half' },
  )
  return Response.json(await upstream.json().catch(() => ({})), { status: upstream.status })
}
