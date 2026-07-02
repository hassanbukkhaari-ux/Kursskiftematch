import { NextRequest } from 'next/server'
import { ok, forbidden, notFound, serverError, withAuth } from '@/lib/api-response'
import { logAuditEvent } from '@/lib/audit'

// DELETE /api/professionals/[id]/availability-periods/[periodId]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; periodId: string }> }
) {
  const { id, periodId } = await params
  return withAuth(request, async (userId, role) => {
    if (role !== 'admin' && userId !== id) return forbidden()

    const { createClient } = await import('@/lib/supabase/server')
    const db = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dba = db as any

    // Verify period belongs to this professional
    const { data: period } = await dba
      .from('professional_availability_periods')
      .select('id, professional_id, period_type, start_date')
      .eq('id', periodId)
      .eq('professional_id', id)
      .single()

    if (!period) return notFound('Availability period')

    const { error } = await dba
      .from('professional_availability_periods')
      .delete()
      .eq('id', periodId)

    if (error) return serverError(error.message)

    await logAuditEvent(db, {
      event_type: 'PROFESSIONAL_UPDATED',
      actor_id: userId,
      resource_type: 'professionals',
      resource_id: id,
      metadata: { action: 'availability_period_removed', period_id: periodId },
    })

    return ok({ deleted: true })
  })
}
