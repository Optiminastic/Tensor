import type { CallLog } from '@/lib/validators/call-logs'
import type { MessageLog, MessageTemplate } from '@/lib/validators/message-logs'
import { listCallLogs } from '@/services/call-logs.service'
import { getMessageTemplate, listMessageLogs } from '@/services/message-logs.service'

export interface AgentData {
  calls: CallLog[]
  messages: MessageLog[]
  template: MessageTemplate | null
  /** Why a half could not be read; null when it was. */
  errors: { calls: string | null; messages: string | null }
}

export const NO_AGENT_DATA: AgentData = {
  calls: [],
  messages: [],
  template: null,
  errors: { calls: null, messages: null },
}

/**
 * Everything the win-back agent did: its calls (Sarvam's analytics API), its
 * messages (Tensor's own ledger) and the message template (Meta's).
 *
 * Each settles on its own. Sarvam being unreachable must not blank the
 * messages, which need no upstream at all, and the template - a footnote for
 * old messages - is never a reason for anything to fail.
 */
export async function loadAgentData(token: string, brand: string): Promise<AgentData> {
  const [calls, messages, template] = await Promise.allSettled([
    listCallLogs(token, brand),
    listMessageLogs(token, brand),
    getMessageTemplate(token, brand),
  ])
  return {
    calls: calls.status === 'fulfilled' ? calls.value : [],
    messages: messages.status === 'fulfilled' ? messages.value : [],
    template: template.status === 'fulfilled' ? template.value : null,
    errors: {
      calls:
        calls.status === 'rejected' ? describe(calls.reason, 'Could not load the calls.') : null,
      messages:
        messages.status === 'rejected'
          ? describe(messages.reason, 'Could not load the messages.')
          : null,
    },
  }
}

/** The upstream's own sentence where there is one - its refusals name the fix. */
function describe(reason: unknown, fallback: string): string {
  return reason instanceof Error ? reason.message : fallback
}
