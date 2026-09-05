'use client'

import { Download } from 'lucide-react'
import dynamic from 'next/dynamic'
import type { JSX } from 'react'

import { JobModelUploadButton } from '@/components/production/job-model-upload-button'
import { ModelGeneratingPanel } from '@/components/production/model-generating-panel'
import type { ModelStatus } from '@/components/production/types'
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
  /** Enables the upload control. Omitted where the job id is not to hand. */
  jobId?: string
  /**
   * Whether anyone is waiting on this model. A plank builds itself, so its
   * empty state is "being made", not "somebody please supply one".
   */
  modelStatus?: ModelStatus
}

export function JobModelPreview({
  printFileId,
  jobId,
  modelStatus = 'approval_required',
}: JobModelPreviewProps): JSX.Element {
  if (!printFileId) {
    return (
      <Card className="flex h-full min-h-[420px] flex-col">
        <CardHeader>
          <CardTitle>Product preview</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col items-center justify-center gap-3 p-0">
          {/* Three different situations, and offering the same upload button
              for all of them was the mistake: while a render is in flight the
              only honest thing to show is that it is running. */}
          {modelStatus === 'generating' && jobId ? (
            <ModelGeneratingPanel jobId={jobId} />
          ) : (
            <>
              <p className="text-muted-foreground max-w-sm text-center text-sm">
                {modelStatus === 'failed'
                  ? 'This model could not be built. Upload one to carry on.'
                  : 'This product needs a model before it can be printed. Uploading one approves the job for batching.'}
              </p>
              {jobId ? <JobModelUploadButton jobId={jobId} size="md" /> : null}
            </>
          )}
        </CardContent>
      </Card>
    )
  }

  const fileUrl = `/api/files/${printFileId}`
  return (
    <Card className="flex h-full min-h-[420px] flex-col">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Product preview</CardTitle>
        <div className="flex items-center gap-2">
          {jobId ? <JobModelUploadButton jobId={jobId} hasModel /> : null}
          {/* Same-origin route: the handler mints the backend token from the
              session, so no token is exposed to the browser. */}
          {/* `download` with no value on purpose. Given a value, the browser
              uses it in preference to the server's Content-Disposition - and
              the value here had no file extension, so the model saved as
              something nothing could open. Bare, it forces a download and
              lets the stored filename win. */}
          <a
            href={fileUrl}
            download
            className={buttonVariants({ variant: 'secondary', size: 'sm' })}
          >
            <Download aria-hidden />
            Download model
          </a>
        </div>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 p-0">
        <div className="bg-surface-muted border-border relative h-full min-h-[380px] w-full overflow-hidden rounded-md border">
          <JobModelViewer modelUrl={fileUrl} />
        </div>
      </CardContent>
    </Card>
  )
}
