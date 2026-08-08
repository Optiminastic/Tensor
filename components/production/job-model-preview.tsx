'use client'

import { Download } from 'lucide-react'
import dynamic from 'next/dynamic'
import type { JSX } from 'react'

import { buttonVariants } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// WebGL must not server-render; loading it lazily also keeps three.js out of
// every other page's bundle.
const JobModelViewer = dynamic(() => import('./job-model-viewer').then(m => m.JobModelViewer), {
  ssr: false,
  loading: () => (
    <div className="text-muted-foreground flex h-full w-full items-center justify-center text-sm">
      Loading model preview…
    </div>
  ),
})

interface JobModelPreviewProps {
  printFileId: string | null
  fileName: string
}

export function JobModelPreview({ printFileId, fileName }: JobModelPreviewProps): JSX.Element {
  if (!printFileId) {
    return (
      <Card className="flex h-full min-h-[420px] flex-col">
        <CardHeader>
          <CardTitle>Product preview</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 items-center justify-center p-0">
          <p className="text-muted-foreground text-sm">No print file matched to this job yet.</p>
        </CardContent>
      </Card>
    )
  }

  const fileUrl = `/api/files/${printFileId}`
  return (
    <Card className="flex h-full min-h-[420px] flex-col">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Product preview</CardTitle>
        {/* Same-origin route: the handler mints the backend token from the
            session, so no token is exposed to the browser. */}
        <a
          href={fileUrl}
          download={fileName}
          className={buttonVariants({ variant: 'secondary', size: 'sm' })}
        >
          <Download aria-hidden />
          Download model
        </a>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 p-0">
        <div className="bg-surface-muted border-border relative h-full min-h-[380px] w-full overflow-hidden rounded-md border">
          <JobModelViewer modelUrl={fileUrl} />
        </div>
      </CardContent>
    </Card>
  )
}
