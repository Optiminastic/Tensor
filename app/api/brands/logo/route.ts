import { headers } from 'next/headers'
import { NextResponse } from 'next/server'

import { auth } from '@/lib/auth'
import { createLogger } from '@/lib/logger'
import { LogoStorageError, storeImageBuffer } from '@/lib/logo-storage'

const log = createLogger('BrandLogoUpload')

export const runtime = 'nodejs'

function badRequest(message: string): NextResponse {
  return NextResponse.json({ error: message }, { status: 400 })
}

/**
 * Accepts a single image and stores it under /public/brand-logos, returning its
 * public URL. Identity is re-resolved server-side; an unauthenticated caller is
 * refused. The backend still owns brand:manage — this only parks a file.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session) {
    return NextResponse.json({ error: 'Sign in to upload a logo.' }, { status: 401 })
  }

  let form: FormData
  try {
    form = await request.formData()
  } catch {
    return badRequest('Send the logo as multipart form data.')
  }

  const file = form.get('file')
  if (!(file instanceof File)) {
    return badRequest('Attach a file field named "file".')
  }

  try {
    const bytes = Buffer.from(await file.arrayBuffer())
    const url = await storeImageBuffer(bytes, file.type)
    return NextResponse.json({ url }, { status: 201 })
  } catch (error) {
    if (error instanceof LogoStorageError) return badRequest(error.message)
    log.error({ err: error }, 'Could not write the brand logo')
    return NextResponse.json({ error: 'Could not store the logo.' }, { status: 500 })
  }
}
