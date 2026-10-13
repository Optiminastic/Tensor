'use client'

import { zodResolver } from '@hookform/resolvers/zod'
import { Send } from 'lucide-react'
import { useState, type JSX } from 'react'
import { useForm } from 'react-hook-form'

import { sendReplyAction } from '@/app/dashboard/[brand]/agent/inbox/actions'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { WhatsAppReplyTextSchema, type WhatsAppReplyText } from '@/lib/validators/whatsapp-inbox'

interface WhatsAppReplyBoxProps {
  brand: string
  waId: string
  /** WhatsApp's 24-hour rule: free text only within a day of the customer's last message. */
  windowOpen: boolean
  onSent: () => void
}

/**
 * Replies as the shop. Sending takes the chat over from the bot, exactly as a
 * reply from the WhatsApp Business app does; "Hand back" returns it.
 */
export function WhatsAppReplyBox({
  brand,
  waId,
  windowOpen,
  onSent,
}: WhatsAppReplyBoxProps): JSX.Element {
  const [serverError, setServerError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<WhatsAppReplyText>({ resolver: zodResolver(WhatsAppReplyTextSchema) })

  async function onSubmit(values: WhatsAppReplyText): Promise<void> {
    setServerError(null)
    const result = await sendReplyAction({ brand, waId, text: values.text })
    if (!result.ok) {
      setServerError(result.error ?? 'The reply was not sent.')
      return
    }
    reset()
    onSent()
  }

  if (!windowOpen) {
    return (
      <p className="text-muted-foreground border-border border-t p-4 text-sm text-pretty">
        This customer last wrote more than 24 hours ago. WhatsApp only allows an approved template
        until they message again.
      </p>
    )
  }

  const error = errors.text?.message ?? serverError
  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="border-border flex flex-col gap-2 border-t p-4"
      noValidate
    >
      <label htmlFor="whatsapp-reply" className="sr-only">
        Reply
      </label>
      <Textarea id="whatsapp-reply" rows={3} placeholder="Type a reply…" {...register('text')} />
      <div className="flex items-center justify-between gap-3">
        <p className="text-danger text-sm" role="alert">
          {error}
        </p>
        <Button type="submit" size="sm" disabled={isSubmitting}>
          <Send className="size-4" aria-hidden />
          {isSubmitting ? 'Sending…' : 'Send'}
        </Button>
      </div>
    </form>
  )
}
