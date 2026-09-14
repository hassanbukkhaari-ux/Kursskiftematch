import { withAdminAuth, badRequest, ok, serverError, notFound } from '@/lib/api-response'
import { createServiceClient } from '@/lib/supabase/server'
import { logAuditEvent } from '@/lib/audit'
import type { NextRequest } from 'next/server'

// PATCH /api/admin/professionals/:id/driving-license — admin-only switch
// for whether the matching algorithm may treat this professional as having
// a usable driving licence. has_drivers_license is self-reported by the
// professional and is never trusted directly by the algorithm for this —
// only drivers_license_admin_verified is. Independent of document status,
// so admin decides when to flip it, typically right after approving the
// DRIVING_LICENSE document shown alongside it on this same page.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: professionalId } = await params
  return withAdminAuth(request, async (adminId) => {
    let body: { verified?: boolean }
    try { body = await request.json() } catch { return badRequest('Invalid JSON') }

    if (typeof body.verified !== 'boolean') {
      return badRequest('verified skal være true eller false')
    }

    const svc = createServiceClient()

    const { data: pro } = await (svc as any)
      .from('professionals')
      .select('id')
      .eq('id', professionalId)
      .single()

    if (!pro) return notFound('Professional')

    const { error } = await (svc as any)
      .from('professionals')
      .update({ drivers_license_admin_verified: body.verified })
      .eq('id', professionalId)

    if (error) return serverError(error.message)

    await logAuditEvent(svc, {
      event_type: body.verified ? 'DRIVING_LICENSE_ENABLED_FOR_MATCHING' : 'DRIVING_LICENSE_DISABLED_FOR_MATCHING',
      resource_type: 'professionals',
      resource_id: professionalId,
      actor_id: adminId,
    })

    return ok({ ok: true, drivers_license_admin_verified: body.verified })
  })
}
