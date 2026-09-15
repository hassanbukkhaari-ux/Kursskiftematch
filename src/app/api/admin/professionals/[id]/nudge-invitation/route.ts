import { withAdminAuth, badRequest, ok, serverError, notFound } from '@/lib/api-response'
import { createServiceClient } from '@/lib/supabase/server'
import { logAuditEvent } from '@/lib/audit'
import { sendProfessionalInviteEmail, sendOnboardingReminderEmail } from '@/lib/professionals/invite-email'
import type { NextRequest } from 'next/server'

// POST /api/admin/professionals/:id/nudge-invitation — follow up on a
// pending admin invite. Two cases, picked automatically:
//  - never signed in yet (never clicked the original link): resend the same
//    invite link (Supabase's "invite" type only works for unconfirmed users).
//  - signed in but never finished their profile: an "invite" link would now
//    fail (they're confirmed), so send a magic link straight back to
//    onboarding instead.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: userId } = await params
  return withAdminAuth(request, async (adminId) => {
    const svc = createServiceClient()

    const { data: userRes, error: userError } = await svc.auth.admin.getUserById(userId)
    if (userError || !userRes?.user) return notFound('Bruger')
    const user = userRes.user
    if (!user.invited_at) return badRequest('Denne bruger er ikke oprettet via en admin-invitation')

    const { data: existingPro } = await (svc as any)
      .from('professionals')
      .select('id')
      .eq('id', userId)
      .maybeSingle()
    if (existingPro) return badRequest('Personen har allerede oprettet sin profil')

    const name = (user.user_metadata?.full_name as string | undefined) ?? undefined
    const email = user.email
    if (!email) return serverError('Brugeren har ingen e-mailadresse')

    const alreadySignedIn = !!user.last_sign_in_at
    const { error } = alreadySignedIn
      ? await sendOnboardingReminderEmail(svc, { email, name })
      : await sendProfessionalInviteEmail(svc, { email, name })

    if (error) return serverError(error)

    await logAuditEvent(svc, {
      event_type: alreadySignedIn ? 'PROFESSIONAL_ONBOARDING_REMINDER_SENT' : 'PROFESSIONAL_INVITE_RESENT',
      resource_type: 'professionals',
      resource_id: userId,
      actor_id: adminId,
      metadata: { email },
    })

    return ok({ ok: true, mode: alreadySignedIn ? 'reminder' : 'resent_invite' })
  })
}
