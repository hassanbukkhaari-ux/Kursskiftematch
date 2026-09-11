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
      text: `${greeting}

Du er blevet inviteret til at blive kontaktperson hos Kursskifte.

Klik på linket nedenfor for at oprette din konto:
${inviteUrl}

Linket er personligt og udløber efter 24 timer. Når du klikker det, bliver du bedt om at vælge en adgangskode — herefter har du direkte adgang til systemet.

Med venlig hilsen
Kursskifte-teamet
kontakt@kursskifte.dk`,
    })

    if (error) return serverError(error.message)

    return ok({ ok: true, email })
  })
}
