import type { Mail } from '@/lib/mailer'
import type { Role } from '@/lib/validators/authz'

const ROLE_LABELS: Record<Role, string> = {
  ADMIN: 'Admin',
  DESIGNER: 'Designer',
  PROJECT_LEAD: 'Project Lead',
  PERFORMANCE_MARKETER: 'Performance Marketer',
  OPERATOR: 'Operator',
}

interface InviteEmailInput {
  to: string
  role: Role
  inviteUrl: string
  /** The admin who sent it. Named in the email so it is verifiable. */
  invitedByName: string
  invitedByEmail: string
}

/**
 * The invitation email.
 *
 * This message asks someone to click a link that grants them a role, which is
 * exactly what a phishing email asks. So it is written to be checkable rather
 * than persuasive:
 *
 *   - it names who invited them, so the recipient can verify offline;
 *   - it states the role, so an unexpected one is a red flag they can act on;
 *   - it says plainly that we will never send them a password;
 *   - it shows the URL as text, so nobody has to trust a button's label.
 *
 * There is no password in here, and there never will be — the link lets them
 * set their own.
 */
export function buildInviteEmail(input: InviteEmailInput): Mail {
  const roleLabel = ROLE_LABELS[input.role]
  return {
    to: input.to,
    // Names the tool and the role, so it is recognisable in a crowded inbox
    // and an unexpected role is obvious at a glance.
    subject: `You have been invited to Tensor as ${roleLabel}`,
    text: buildText(input, roleLabel),
    html: buildHtml(input, roleLabel),
  }
}

function buildText(
  { inviteUrl, invitedByName, invitedByEmail }: InviteEmailInput,
  roleLabel: string,
): string {
  return [
    `${invitedByName} (${invitedByEmail}) has invited you to Tensor as ${roleLabel}.`,
    '',
    "Tensor is Optiminastic's internal costing and pricing tool.",
    '',
    'Open this link to choose your password:',
    inviteUrl,
    '',
    'The link works once and expires in 72 hours.',
    '',
    'We will never send you a password, and never ask for one by email.',
    'You choose your own, and nobody else - including whoever invited you -',
    'ever knows it.',
    '',
    `If you were not expecting this, ignore it and tell ${invitedByEmail}.`,
  ].join('\n')
}

// Inline styles and a table-free layout: every mail client mangles CSS
// differently, and this only has to be legible, not designed.
function buildHtml(
  { inviteUrl, invitedByName, invitedByEmail }: InviteEmailInput,
  roleLabel: string,
): string {
  return `
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#2b2b2b;background:#f7f5f2">
  <h1 style="margin:0 0 8px;font-size:22px;font-weight:600;letter-spacing:-0.02em">You have been invited to Tensor</h1>
  <p style="margin:0 0 24px;font-size:15px;line-height:1.55;color:#65635f">
    <strong style="color:#2b2b2b">${escapeHtml(invitedByName)}</strong>
    (${escapeHtml(invitedByEmail)}) has invited you as
    <strong style="color:#2b2b2b">${escapeHtml(roleLabel)}</strong>.
    Tensor is Optiminastic&rsquo;s internal costing and pricing tool.
  </p>

  <a href="${escapeHtml(inviteUrl)}"
     style="display:inline-block;background:#0f56a1;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:4px;font-size:15px;font-weight:500">
    Choose your password
  </a>

  <p style="margin:24px 0 8px;font-size:13px;line-height:1.55;color:#65635f">
    Or paste this into your browser:
  </p>
  <p style="margin:0 0 24px;font-size:12px;line-height:1.5;word-break:break-all;color:#65635f;font-family:ui-monospace,SFMono-Regular,Menlo,monospace">
    ${escapeHtml(inviteUrl)}
  </p>

  <p style="margin:0 0 8px;font-size:13px;line-height:1.55;color:#65635f">
    The link works <strong style="color:#2b2b2b">once</strong> and expires in
    <strong style="color:#2b2b2b">72 hours</strong>.
  </p>

  <p style="margin:24px 0 0;padding-top:16px;border-top:1px solid #e0deda;font-size:12px;line-height:1.6;color:#8b8a87">
    We will never send you a password, and never ask for one by email. You choose
    your own, and nobody else &mdash; including whoever invited you &mdash; ever knows it.
    If you were not expecting this, ignore it and tell ${escapeHtml(invitedByEmail)}.
  </p>
</div>`.trim()
}

/**
 * The admin types the invitee's email, and their own name comes from the
 * database — but both land in HTML here, so neither is trusted.
 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
