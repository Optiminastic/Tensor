import { Box, FileBox } from 'lucide-react'
import type { JSX } from 'react'

import type { ModelInspection } from '../model-colours'
import { ModelFormatNotice } from '../model-format-notice'

import { DropZone } from './drop-zone'
import { fileSize, MAX_FILE_MB, MODEL_ACCEPT } from './upload-schema'

interface ModelFileZoneProps {
  file: File | null
  inspection: { result: ModelInspection | null; loading: boolean }
  onFile: (file: File | null) => void
}

/** The model drop zone; once chosen, the file, its size and what was detected in it. */
export function ModelFileZone({ file, inspection, onFile }: ModelFileZoneProps): JSX.Element {
  return (
    <DropZone
      id="model-file"
      accept={MODEL_ACCEPT}
      prompt="Drop the model file, or browse"
      hint={`STL, 3MF or STEP, up to ${MAX_FILE_MB} MB`}
      icon={<Box className="size-5" aria-hidden />}
      onFile={onFile}
    >
      {file ? (
        <span className="relative flex flex-col items-center gap-2">
          <span className="bg-landing-lime text-landing-ink grid size-12 place-items-center rounded-2xl">
            <FileBox className="size-5" aria-hidden />
          </span>
          <span className="max-w-full truncate text-sm font-medium">{file.name}</span>
          <span className="text-muted-foreground font-mono text-xs tabular-nums">
            {fileSize(file.size)} · click to replace
          </span>
          <ModelFormatNotice inspection={inspection.result} loading={inspection.loading} />
        </span>
      ) : undefined}
    </DropZone>
  )
}
