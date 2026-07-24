'use client'

import { useState } from 'react'
import { z } from 'zod'

// Browser -> our own Next route (not Tensor-Core), so this lives in a hook rather
// than a server-only service. The route stores the file and returns its URL.
const UploadResponseSchema = z.object({ url: z.string() })
const ErrorResponseSchema = z.object({ error: z.string() })

interface UseLogoUpload {
  upload: (file: File) => Promise<string>
  uploading: boolean
  error: string | null
  clearError: () => void
}

export function useLogoUpload(): UseLogoUpload {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function upload(file: File): Promise<string> {
    setUploading(true)
    setError(null)
    try {
      const body = new FormData()
      body.set('file', file)
      const response = await fetch('/api/brands/logo', { method: 'POST', body })
      const payload: unknown = await response.json().catch(() => null)

      if (!response.ok) {
        const message = ErrorResponseSchema.safeParse(payload).data?.error ?? 'Upload failed.'
        setError(message)
        throw new Error(message)
      }

      const parsed = UploadResponseSchema.safeParse(payload)
      if (!parsed.success) {
        const message = 'The upload response was malformed.'
        setError(message)
        throw new Error(message)
      }
      return parsed.data.url
    } finally {
      setUploading(false)
    }
  }

  return { upload, uploading, error, clearError: () => setError(null) }
}
