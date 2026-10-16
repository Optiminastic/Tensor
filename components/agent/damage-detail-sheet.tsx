'use client'

import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { type JSX, useEffect, useState } from 'react'

import { loadDamageReportAction } from '@/app/dashboard/[brand]/agent/damaged-products/actions'
import { loadThreadAction } from '@/app/dashboard/[brand]/agent/inbox/actions'
import { DamagePhotoGrid } from '@/components/agent/damage-photo-grid'
import { DAMAGE_STATUS_CONFIG } from '@/components/agent/damage-status-config'
import { DamageStatusControl } from '@/components/agent/damage-status-control'
import { WhatsAppMessageBubble } from '@/components/agent/whatsapp-message-bubble'
import { displayNumber, messageTime } from '@/components/agent/whatsapp-time'
import { TonePill } from '@/components/production/tone-pill'
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Tabs } from '@/components/ui/tabs'
import type { DamageReport, DamageReportDetail } from '@/lib/validators/whatsapp-damage'
import type { WhatsAppMessage } from '@/lib/validators/whatsapp-inbox'

interface DamageDetailSheetProps {
  brand: string
  /** Kept while the drawer closes, so it slides out whole. */
  report: DamageReport | null
  open: boolean
  canUpdate: boolean
  onClose: () => void
  onChanged: () => void
}

/**
 * One damage report: the photographs, the conversation it came from, the order
 * and where anyone has got to with it.
 *
 * NOTHING IS FETCHED UNTIL IT OPENS, and the chat is its own request made only
 * when that tab is selected - the same shape as the order drawer. A list of
 * fifty reports must not pull fifty threads nobody reads.
 */
export function DamageDetailSheet({
  brand,
  report,
  open,
  canUpdate,
  onClose,
  onChanged,
}: DamageDetailSheetProps): JSX.Element {
  return (
    <Sheet open={open} onOpenChange={next => !next && onClose()}>
      <SheetContent side="right" className="flex w-full max-w-2xl flex-col">
        {report ? (
          // Keyed on the report, so the tab and everything fetched start fresh
          // for each one rather than leaking from the last.
          <DrawerContents
            key={report.id}
            brand={brand}
            report={report}
            canUpdate={canUpdate}
            onChanged={onChanged}
          />
        ) : null}
      </SheetContent>
    </Sheet>
  )
}

type View = 'photos' | 'chat' | 'order'

interface DrawerContentsProps {
  brand: string
  report: DamageReport
  canUpdate: boolean
  onChanged: () => void
}

function DrawerContents({ brand, report, canUpdate, onChanged }: DrawerContentsProps): JSX.Element {
  const [view, setView] = useState<View>('photos')
  const detail = useDamageDetail(brand, report.id)
  const chat = useThread(brand, report.wa_id, view === 'chat')
  const status = DAMAGE_STATUS_CONFIG[report.status]

  return (
    <>
      <SheetHeader>
        <SheetTitle className="flex flex-wrap items-center gap-2.5">
          <span className="font-mono">{report.order_number}</span>
          <TonePill label={status.label} tone={status.tone} />
        </SheetTitle>
        <SheetDescription asChild>
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span>
              {report.customer_name || 'Customer'} · {displayNumber(report.wa_id)}
            </span>
            <span>Reported {messageTime(report.reported_at)}</span>
            {report.order_id ? (
              <Link
                href={`/dashboard/${brand}/production/orders/${report.order_id}`}
                prefetch={false}
                className="text-accent inline-flex items-center gap-1 underline-offset-4 hover:underline"
              >
                Open the order
                <ExternalLink className="size-3" aria-hidden />
              </Link>
            ) : null}
          </div>
        </SheetDescription>
      </SheetHeader>

      <div className="px-6 pb-3">
        <Tabs
          tabs={[
            { value: 'photos', label: 'Photos' },
            { value: 'chat', label: 'Chat' },
            { value: 'order', label: 'Order' },
          ]}
          value={view}
          onValueChange={value => setView(value as View)}
          label="Damage report view"
        />
      </div>

      <SheetBody className="flex-1" role="tabpanel">
        {view === 'photos' ? (
          <div className="flex flex-col gap-6">
            {detail.error ? (
              <Failed what="this report's photos" />
            ) : !detail.data ? (
              <Loading />
            ) : (
              <DamagePhotoGrid
                brand={brand}
                photos={detail.data.photos}
                sent={report.photo_count}
              />
            )}
            <DamageStatusControl
              brand={brand}
              report={report}
              canUpdate={canUpdate}
              onChanged={onChanged}
            />
          </div>
        ) : view === 'chat' ? (
          chat.error ? (
            <Failed what="this conversation" />
          ) : !chat.data ? (
            <Loading />
          ) : (
            <div className="flex flex-col gap-3">
              {chat.data.map(message => (
                <WhatsAppMessageBubble key={message.id} message={message} brand={brand} />
              ))}
            </div>
          )
        ) : (
          <OrderTab brand={brand} report={report} />
        )}
      </SheetBody>
    </>
  )
}

function OrderTab({ brand, report }: { brand: string; report: DamageReport }): JSX.Element {
  if (!report.order_id) {
    return (
      <p className="text-muted-foreground text-sm text-pretty">
        Order <span className="font-mono">{report.order_number}</span> has not been imported into
        Tensor. The bot found it in Shopify, so the damage tag and note were written there.
      </p>
    )
  }
  return (
    <div className="flex flex-col gap-3 text-sm">
      <p className="text-muted-foreground text-pretty">
        This report is against order <span className="font-mono">{report.order_number}</span>.
      </p>
      <Link
        href={`/dashboard/${brand}/production/orders/${report.order_id}`}
        prefetch={false}
        className="text-accent inline-flex items-center gap-1 underline-offset-4 hover:underline"
      >
        Open the full order
        <ExternalLink className="size-3" aria-hidden />
      </Link>
    </div>
  )
}

function Loading(): JSX.Element {
  return <p className="text-muted-foreground py-8 text-center text-sm">Loading…</p>
}

function Failed({ what }: { what: string }): JSX.Element {
  return (
    <p role="alert" className="text-danger py-8 text-center text-sm text-pretty">
      Could not load {what}. Close this and try again.
    </p>
  )
}

/** The report and its photographs, asked for as the drawer opens. */
function useDamageDetail(
  brand: string,
  id: string,
): { data: DamageReportDetail | null; error: boolean } {
  const [data, setData] = useState<DamageReportDetail | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    let cancelled = false
    setData(null)
    setError(false)
    loadDamageReportAction({ brand, id })
      .then(result => {
        if (cancelled) return
        if (result.ok && result.data) setData(result.data)
        else setError(true)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
    return () => {
      cancelled = true
    }
  }, [brand, id])

  return { data, error }
}

/**
 * The conversation, asked for only when that tab is opened.
 *
 * Reuses the inbox's own action, so the thread here and the thread there
 * cannot drift. Fetched once per report: `data !== null` is the guard, so
 * switching tabs back and forth does not re-ask.
 */
function useThread(
  brand: string,
  waId: string,
  wanted: boolean,
): { data: WhatsAppMessage[] | null; error: boolean } {
  const [data, setData] = useState<WhatsAppMessage[] | null>(null)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (!wanted || data !== null) return
    let cancelled = false
    setError(false)
    loadThreadAction({ brand, waId })
      .then(result => {
        if (cancelled) return
        if (result.ok && result.data) setData(result.data.items)
        else setError(true)
      })
      .catch(() => {
        if (!cancelled) setError(true)
      })
    return () => {
      cancelled = true
    }
  }, [wanted, brand, waId, data])

  return { data, error }
}
