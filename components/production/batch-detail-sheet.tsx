'use client'

import Link from 'next/link'
import { useEffect, useState, type JSX } from 'react'

import { getBatchDetail } from '@/app/dashboard/[brand]/production/batch-jobs-actions'
import { BatchDetailGrid } from '@/components/production/batch-detail-grid'
import { BatchDetailHeader } from '@/components/production/batch-detail-header'
import { BatchJobsTable } from '@/components/production/batch-jobs-table'
import { BatchPlatePreview } from '@/components/production/batch-plate-preview'
import type { BatchRecord } from '@/components/production/types'
import { Card } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import type { Machine } from '@/lib/validators/machines'
import type { ProductionJob } from '@/lib/validators/production'

// Matches production.TargetBedUtilisationPercent (internal/production/planner.go),
// same as BatchDetailView's copy - the threshold the backend enforces.
const FULL_BATCH_UTILIZATION_PERCENT = 80

interface BatchDetailSheetProps {
  brand: string
  batchId: string
  batchNumber: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface Loaded {
  batch: BatchRecord
  jobs: ProductionJob[]
  machines: Machine[]
}

/** A batch's full detail in a right-hand panel, opened from a card on the
 * queue board: the same header/metrics/jobs the batch page shows, with the
 * merged plate's 3D preview at the bottom.
 *
 * Stacked vertically rather than the batch page's two-column split - the panel
 * is a tall narrow column, so the preview belongs under the detail rather than
 * beside it.
 *
 * Fetched when opened, and only then: a Completed column can hold dozens of
 * batches, and the plate bounding box the preview needs comes from the
 * single-batch endpoint that the board's own list never calls. */
export function BatchDetailSheet({
  brand,
  batchId,
  batchNumber,
  open,
  onOpenChange,
}: BatchDetailSheetProps): JSX.Element {
  const [data, setData] = useState<Loaded | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    let live = true
    setError(null)
    void getBatchDetail(batchId).then(res => {
      if (!live) return
      if (!res.ok || !res.data) {
        setError(res.error ?? 'Could not load the batch.')
        return
      }
      setData(res.data)
    })
    return () => {
      live = false
    }
  }, [open, batchId])

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent aria-describedby={undefined}>
        <SheetHeader>
          <SheetTitle className="font-mono">{batchNumber}</SheetTitle>
          <SheetDescription>
            <Link
              href={`/dashboard/${brand}/production/batches/${batchId}`}
              className="hover:text-foreground underline underline-offset-2"
            >
              Open the full batch page
            </Link>
          </SheetDescription>
        </SheetHeader>
        <SheetBody>
          {error ? (
            <p role="alert" className="text-danger text-sm">
              {error}
            </p>
          ) : null}
          {!error && data === null ? (
            <p className="text-muted-foreground text-sm">Loading batch…</p>
          ) : null}
          {data ? <BatchDetailSheetContent brand={brand} data={data} /> : null}
        </SheetBody>
      </SheetContent>
    </Sheet>
  )
}

/** The loaded body, split out to keep the fetching shell above short. */
function BatchDetailSheetContent({ brand, data }: { brand: string; data: Loaded }): JSX.Element {
  const { batch, jobs, machines } = data
  return (
    <>
      <Card>
        <BatchDetailHeader batch={batch} machines={machines} />
        <Separator />
        <BatchDetailGrid batch={batch} />
      </Card>
      <BatchJobsTable
        brand={brand}
        batchId={batch.id}
        jobs={jobs}
        canEdit={batch.status === 'pending_approval'}
        isFull={(batch.bedUtilizationPercent ?? 0) >= FULL_BATCH_UTILIZATION_PERCENT}
      />
      <BatchPlatePreview
        batchId={batch.id}
        batchNumber={batch.batchNumber}
        plateBboxXMm={batch.plateBboxXMm}
        plateBboxYMm={batch.plateBboxYMm}
        plateBboxZMm={batch.plateBboxZMm}
      />
    </>
  )
}
