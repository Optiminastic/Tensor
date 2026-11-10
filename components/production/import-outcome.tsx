import type { JSX } from 'react'

interface ImportOutcomeProps {
  error: string | null
  problems: string[]
  result: string | null
}

/** What an import answered: the refusal, its row-by-row problems, or the counts. */
export function ImportOutcome({ error, problems, result }: ImportOutcomeProps): JSX.Element {
  return (
    <>
      {error ? (
        <p role="alert" className="bg-danger-subtle text-danger rounded-2xl px-4 py-3 text-sm">
          {error}
        </p>
      ) : null}
      {problems.length > 0 ? (
        <div className="border-danger/40 max-h-64 overflow-y-auto rounded-md border">
          <ul className="divide-border divide-y text-sm">
            {problems.map(problem => (
              <li key={problem} className="px-3 py-2">
                {problem}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
      {result ? (
        <p role="status" className="bg-success-subtle text-success rounded-2xl px-4 py-3 text-sm">
          {result}
        </p>
      ) : null}
    </>
  )
}
