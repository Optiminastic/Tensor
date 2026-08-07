'use client'

import { useQuery } from '@tanstack/react-query'
import { MessageSquarePlus } from 'lucide-react'
import { useState, type JSX } from 'react'

import { addDesignComment, fetchDesignReviews } from '@/app/dashboard/[brand]/designs/actions'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import type { DesignTimelineEntry, ReviewKind } from '@/lib/validators/designs'

const KIND_LABEL: Record<ReviewKind, string> = {
  submit: 'Submitted for review',
  approve: 'Approved',
  reject: 'Sent back for changes',
  comment: 'Commented',
}

// The dot colour encodes the event, so the timeline is scannable without reading
// every label - matching the Green/Yellow/Red semantics used elsewhere.
const KIND_DOT: Record<ReviewKind, string> = {
  submit: 'bg-accent',
  approve: 'bg-success',
  reject: 'bg-danger',
  comment: 'bg-border-strong',
}

interface DesignTimelineProps {
  designId: string
  // Changes whenever the design is acted on, so the timeline refetches to pick
  // up the submit / approve / reject events those actions record.
  refreshKey: string
}

/** The design's activity timeline: who did what and when, with the author's name
 * or email and the reason on a send-back. Anyone who can view the design can add
 * a comment, which appears as a new entry. */
export function DesignTimeline({ designId, refreshKey }: DesignTimelineProps): JSX.Element {
  const { data: entries, refetch } = useQuery({
    queryKey: ['design-reviews', designId, refreshKey],
    queryFn: async (): Promise<DesignTimelineEntry[]> => {
      const outcome = await fetchDesignReviews(designId)
      if (!outcome.ok || !outcome.data) {
        throw new Error(outcome.error ?? 'Could not load the timeline.')
      }
      return outcome.data
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Timeline</CardTitle>
        <p className="text-muted-foreground text-sm">Who did what, and when.</p>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {entries && entries.length > 0 ? (
          <ol className="flex flex-col">
            {entries.map((entry, index) => (
              <TimelineItem key={entry.id} entry={entry} last={index === entries.length - 1} />
            ))}
          </ol>
        ) : (
          <p className="text-muted-foreground text-sm">No activity yet.</p>
        )}
        <CommentComposer designId={designId} onPosted={() => void refetch()} />
      </CardContent>
    </Card>
  )
}

interface TimelineItemProps {
  entry: DesignTimelineEntry
  last: boolean
}

function TimelineItem({ entry, last }: TimelineItemProps): JSX.Element {
  const who = entry.author_name ?? entry.author_email ?? 'Unknown user'
  const when = new Date(entry.created_at).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  return (
    <li className="grid grid-cols-[auto_1fr] gap-x-4">
      <div className="flex flex-col items-center">
        <span
          className={cn('mt-1.5 size-2.5 shrink-0 rounded-full', KIND_DOT[entry.kind])}
          aria-hidden
        />
        {last ? null : <span className="bg-border mt-1 w-px flex-1" aria-hidden />}
      </div>
      <div className={cn('flex flex-col gap-1.5', last ? 'pb-0' : 'pb-6')}>
        <p className="text-foreground text-sm font-medium">{KIND_LABEL[entry.kind]}</p>
        {entry.body ? (
          <p className="text-muted-foreground text-sm whitespace-pre-line">{entry.body}</p>
        ) : null}
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          <time className="text-subtle-foreground font-mono tabular-nums">{when}</time>
          <span className="text-subtle-foreground" aria-hidden>
            ·
          </span>
          <span className="text-muted-foreground flex items-center gap-1.5">
            By
            <Avatar name={who} />
            <span className="text-foreground font-medium">{who}</span>
          </span>
        </div>
      </div>
    </li>
  )
}

function Avatar({ name }: { name: string }): JSX.Element {
  const initial = name.trim().charAt(0).toUpperCase() || '?'
  return (
    <span
      aria-hidden
      className="bg-accent-subtle text-accent inline-flex size-5 items-center justify-center rounded-full text-[10px] font-semibold"
    >
      {initial}
    </span>
  )
}

interface CommentComposerProps {
  designId: string
  onPosted: () => void
}

function CommentComposer({ designId, onPosted }: CommentComposerProps): JSX.Element {
  const [open, setOpen] = useState(false)
  const [body, setBody] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function post(): Promise<void> {
    if (body.trim().length === 0) return
    setError(null)
    setPending(true)
    const outcome = await addDesignComment(designId, body.trim())
    setPending(false)
    if (!outcome.ok) {
      setError(outcome.error ?? 'Could not add the comment.')
      return
    }
    setBody('')
    setOpen(false)
    onPosted()
  }

  return (
    <div className="border-border border-t pt-4">
      <Dialog
        open={open}
        onOpenChange={next => {
          setOpen(next)
          if (next) setError(null)
        }}
      >
        <DialogTrigger asChild>
          <Button variant="secondary" size="sm">
            <MessageSquarePlus aria-hidden />
            Comment
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add a comment</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <Textarea
              rows={4}
              value={body}
              onChange={event => setBody(event.target.value)}
              placeholder="Add a comment"
              aria-label="Comment"
            />
            {error ? (
              <p role="alert" className="text-danger text-sm">
                {error}
              </p>
            ) : null}
            <div className="flex justify-end">
              <Button
                size="sm"
                disabled={pending || body.trim().length === 0}
                onClick={() => void post()}
              >
                {pending ? 'Posting…' : 'Post comment'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
