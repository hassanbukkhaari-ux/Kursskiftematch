import type { SupabaseClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

function wrapEmail(eyebrow: string, heading: string, greeting: string, bodyHtml: string, buttonLabel: string, actionUrl: string, footnote: string) {
  return `<!DOCTYPE html><html lang="da"><body style="margin:0;padding:0;background:#F6F3EE;font-family:system-ui,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 16px;">
<table width="100%" style="max-width:480px;background:#ffffff;border-radius:16px;border:1px solid #E0DAD0;overflow:hidden;">
<tr><td style="padding:32px 32px 0;">
  <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#C8993A;">${eyebrow}</p>
  <h1 style="margin:0 0 16px;font-size:22px;color:#1A1F1C;">${heading}</h1>
  <p style="margin:0 0 8px;font-size:14px;color:#4A4F48;line-height:1.6;">${greeting}</p>
  <p style="margin:0 0 24px;font-size:14px;color:#4A4F48;line-height:1.6;">${bodyHtml}</p>
  <p style="margin:0 0 24px;">
    <a href="${actionUrl}" style="display:inline-block;background:#1C3829;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 28px;border-radius:10px;">${buttonLabel}</a>
  </p>
  <p style="margin:0 0 24px;font-size:12px;color:#6B7569;line-height:1.6;">${footnote}</p>
</td></tr>
<tr><td style="padding:20px 32px;border-top:1px solid #E0DAD0;">
  <p style="margin:0;font-size:12px;color:#6B7569;">Med venlig hilsen<br><strong style="color:#1A1F1C;">Kursskifte-teamet</strong><br>kontakt@kursskifte.dk</p>
</td></tr>
</table>
</td></tr></table>
</body></html>`
}

// Shared by the initial invite (invite-professional route) and by the
// "resend" action on the pending-invitations list — same link generation,
// same email, so admin re-sending gets the exact experience as the original.
//
// Uses properties.hashed_token to build a link straight to our own
// /auth/callback?token_hash=...&type=invite, the same way the working
// forgot-password flow (src/app/api/auth/reset-password/route.ts) already
// does — instead of properties.action_link, which routes the recipient
// through Supabase's own hosted /auth/v1/verify page first. That extra hop
// was landing invited contact persons back on the plain login form instead
// of /set-password (they'd have to use "forgot password" to recover), while
// the direct token_hash link works reliably.
export async function sendProfessionalInviteEmail(
  svc: SupabaseClient,
  { email, name }: { email: string; name?: string }
): Promise<{ error?: string }> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://kursskifte.dk'
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) return { error: 'Email service not configured' }

  const { data: linkData, error: linkError } = await svc.auth.admin.generateLink({
    type: 'invite',
    email,
    options: {
      data: { full_name: name || undefined },
    },
  })
  if (linkError) return { error: linkError.message }

  const tokenHash = linkData.properties.hashed_token
  const inviteUrl = `${base}/auth/callback?token_hash=${tokenHash}&type=invite`

  const greeting = name ? `Hej ${name},` : 'Hej,'
  const resend = new Resend(resendKey)
  const { error } = await resend.emails.send({
    from: 'Kursskifte <noreply@kursskifte.dk>',
    to: email,
    subject: 'Du er inviteret som kontaktperson — Kursskifte',
    html: wrapEmail(
      'Kursskifte',
      'Du er inviteret som kontaktperson',
      greeting,
      'Du er blevet inviteret til at blive kontaktperson hos Kursskifte. Klik på knappen nedenfor for at oprette din konto og vælge en personlig adgangskode.',
      'Opret min konto',
      inviteUrl,
      'Linket er personligt og udløber efter 24 timer. Hvis du ikke har bedt om denne invitation, kan du se bort fra denne e-mail.'
    ),
  })
  if (error) return { error: error.message }
  return {}
}

// For someone who has already clicked their first invite (so a fresh
// "invite" link would fail — Supabase only issues those to unconfirmed
// users) but never finished their profile. A magic link logs them straight
// back in and resumes onboarding, no password needed. Same direct
// token_hash approach as sendProfessionalInviteEmail above.
export async function sendOnboardingReminderEmail(
  svc: SupabaseClient,
  { email, name }: { email: string; name?: string }
): Promise<{ error?: string }> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://kursskifte.dk'
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) return { error: 'Email service not configured' }

  const { data: linkData, error: linkError } = await svc.auth.admin.generateLink({
    type: 'magiclink',
    email,
  })
  if (linkError) return { error: linkError.message }

  const tokenHash = linkData.properties.hashed_token
  const reminderUrl = `${base}/auth/callback?token_hash=${tokenHash}&type=magiclink&next=/onboarding`

  const greeting = name ? `Hej ${name},` : 'Hej,'
  const resend = new Resend(resendKey)
  const { error } = await resend.emails.send({
    from: 'Kursskifte <noreply@kursskifte.dk>',
    to: email,
    subject: 'Færdiggør din profil hos Kursskifte',
    html: wrapEmail(
      'Kursskifte',
      'Din profil er ikke helt færdig endnu',
      greeting,
      'Du oprettede en konto hos Kursskifte, men er ikke helt færdig med at udfylde din profil som kontaktperson. Klik på knappen nedenfor for at logge ind og fortsætte, hvor du slap.',
      'Fortsæt min profil',
      reminderUrl,
      'Linket er personligt og udløber efter 24 timer.'
    ),
  })
  if (error) return { error: error.message }
  return {}
}

// For someone with a real profile already (professionals row exists) who
// just hasn't filled in the fields matching needs — weekly capacity and/or
// availability, the same two fields that block activation
// (see /api/admin/professionals/[id]/status/route.ts). A magic link straight
// to their profile page, no password needed.
export async function sendProfileCompletionReminderEmail(
  svc: SupabaseClient,
  { email, name }: { email: string; name?: string }
): Promise<{ error?: string }> {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://kursskifte.dk'
  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) return { error: 'Email service not configured' }

  const { data: linkData, error: linkError } = await svc.auth.admin.generateLink({
    type: 'magiclink',
    email,
  })
  if (linkError) return { error: linkError.message }

  const tokenHash = linkData.properties.hashed_token
  const reminderUrl = `${base}/auth/callback?token_hash=${tokenHash}&type=magiclink&next=/dashboard/profile`

  const greeting = name ? `Hej ${name},` : 'Hej,'
  const resend = new Resend(resendKey)
  const { error } = await resend.emails.send({
    from: 'Kursskifte <noreply@kursskifte.dk>',
    to: email,
    subject: 'Din profil mangler oplysninger — Kursskifte',
    html: wrapEmail(
      'Kursskifte',
      'Din profil mangler stadig lidt',
      greeting,
      'Vi mangler stadig ugentlig kapacitet og/eller din tilgængelighed på din profil hos Kursskifte, før du kan blive matchet til sager. Klik på knappen nedenfor for at logge ind og udfylde det.',
      'Udfyld min profil',
      reminderUrl,
      'Linket er personligt og udløber efter 24 timer.'
    ),
  })
  if (error) return { error: error.message }
  return {}
}
