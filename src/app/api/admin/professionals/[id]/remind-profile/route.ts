import { withAdminAuth, ok, badRequest, notFound, serverError } from '@/lib/api-response'
import { createServiceClient } from '@/lib/supabase/server'
import { logAuditEvent } from '@/lib/audit'
import { sendProfileCompletionReminderEmail } from '@/lib/professionals/invite-email'
import type { NextRequest } from 'next/server'

// POST /api/admin/professionals/[id]/remind-profile — manual nudge for a
// contact person who has a profile but hasn't filled in weekly capacity
// and/or availability yet (the fields that block activation). Admin
// triggers this one at a time, per person, from the incomplete-profiles list.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: professionalId } = await params
  return withAdminAuth(request, async (adminId) => {
    try {
      const svc = createServiceClient() as any

      const { data: pro, error: proError } = await svc
        .from('professionals')
        .select('id, capacity_hours_week, availability_status, profiles!inner(email, full_name)')
        .eq('id', professionalId)
        .maybeSingle()

      if (proError) {
        console.error('[remind-profile] Failed to load professional', professionalId, proError)
        return serverError(proError.message || 'Kunne ikke hente kontaktpersonen')
      }
      if (!pro) return notFound('Kontaktperson')

      const capacityMissing = !pro.capacity_hours_week || pro.capacity_hours_week <= 0
      const availabilityMissing = pro.availability_status === 'UNAVAILABLE'
      if (!capacityMissing && !availabilityMissing) {
        return badRequest('Profilen mangler ikke kapacitet eller tilgængelighed længere')
      }

      const email = pro.profiles?.email
      if (!email) return serverError('Kontaktpersonen har ingen e-mailadresse')
      const name = pro.profiles?.full_name || undefined

      const { error } = await sendProfileCompletionReminderEmail(svc, { email, name })
      if (error) {
        console.error('[remind-profile] Failed to send reminder for', professionalId, error)
        return serverError(error)
      }

      await logAuditEvent(svc, {
        event_type: 'PROFILE_COMPLETION_REMINDER_SENT',
        actor_id: adminId,
        resource_type: 'professionals',
        resource_id: professionalId,
        metadata: { email },
      })

      return ok({ ok: true })
    } catch (err) {
      console.error('[remind-profile] Unexpected error for', professionalId, err)
      const message = err instanceof Error ? err.message : 'Uventet fejl — prøv igen eller kontakt support'
      return serverError(message)
    }
  })
}
