import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withAdminAuth, badRequest, ok, serverError } from '@/lib/api-response'
import { createServiceClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

const InviteSchema = z.object({
  email: z.string().email('Ugyldig e-mailadresse'),
  name: z.string().optional(),
})

export async function POST(request: NextRequest) {
  return withAdminAuth(request, async () => {
    let body: unknown
    try { body = await request.json() } catch { return badRequest('Invalid JSON') }

    const parsed = InviteSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.issues.map(e => e.message).join(', '))

    const { email, name } = parsed.data
    const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://kursskifte.dk'

    const resendKey = process.env.RESEND_API_KEY
    if (!resendKey) return serverError('Email service not configured')

    // Generate a Supabase invite link (magic link — clicking it authenticates the user)
    const db = createServiceClient()
    const { data: linkData, error: linkError } = await db.auth.admin.generateLink({
      type: 'invite',
      email,
      options: {
        data: { full_name: name || undefined },
        redirectTo: `${base}/auth/callback?next=/set-password`,
      },
    })

    if (linkError) return serverError(linkError.message)

    const inviteUrl = linkData.properties.action_link
    const greeting = name ? `Hej ${name},` : 'Hej,'

    const resend = new Resend(resendKey)
    const { error } = await resend.emails.send({
      from: 'Kursskifte <noreply@kursskifte.dk>',
      to: email,
      subject: 'Du er inviteret som kontaktperson — Kursskifte',
      html: `<!DOCTYPE html><html lang="da"><body style="margin:0;padding:0;background:#F6F3EE;font-family:system-ui,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 16px;">
<table width="100%" style="max-width:480px;background:#ffffff;border-radius:16px;border:1px solid #E0DAD0;overflow:hidden;">
<tr><td style="padding:32px 32px 0;">
  <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#C8993A;">Kursskifte</p>
  <h1 style="margin:0 0 16px;font-size:22px;color:#1A1F1C;">Du er inviteret som kontaktperson</h1>
  <p style="margin:0 0 8px;font-size:14px;color:#4A4F48;line-height:1.6;">${greeting}</p>
  <p style="margin:0 0 24px;font-size:14px;color:#4A4F48;line-height:1.6;">Du er blevet inviteret til at blive kontaktperson hos Kursskifte. Klik på knappen nedenfor for at oprette din konto og vælge en personlig adgangskode.</p>
  <p style="margin:0 0 24px;">
    <a href="${inviteUrl}" style="display:inline-block;background:#1C3829;color:#ffffff;text-decoration:none;font-size:14px;font-weight:600;padding:12px 28px;border-radius:10px;">Opret min konto</a>
  </p>
  <p style="margin:0 0 24px;font-size:12px;color:#6B7569;line-height:1.6;">Linket er personligt og udløber efter 24 timer. Hvis du ikke har bedt om denne invitation, kan du se bort fra denne e-mail.</p>
</td></tr>
<tr><td style="padding:20px 32px;border-top:1px solid #E0DAD0;">
  <p style="margin:0;font-size:12px;color:#6B7569;">Med venlig hilsen<br><strong style="color:#1A1F1C;">Kursskifte-teamet</strong><br>kontakt@kursskifte.dk</p>
</td></tr>
</table>
</td></tr></table>
</body></html>`,
    })

    if (error) return serverError(error.message)

    return ok({ ok: true, email })
  })
}
