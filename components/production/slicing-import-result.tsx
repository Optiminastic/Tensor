import type { JSX } from 'react'

import type { SlicingProfileImport } from '@/lib/validators/slicing-profiles'

interface ImportResultProps {
  result: SlicingProfileImport
}

/** What an import copied, and each pipeline it could not, with the reason. */
export function ImportResult({ result }: ImportResultProps): JSX.Element {
  return (
    <div role="status" className="flex flex-col gap-1 text-sm">
      <p className="text-success">
        Imported <span className="font-mono tabular-nums">{result.imported.length}</span>{' '}
        {result.imported.length === 1 ? 'pipeline' : 'pipelines'}.
      </p>
      {result.skipped.map(s => (
        <p key={s.pipeline_id} className="text-muted-foreground text-xs">
          Skipped {s.name}: {s.reason}.
        </p>
      ))}
    </div>
  )
}
