import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, notFound, badRequest, forbidden, serverError, withAuth, withAdminAuth } from '@/lib/api-response'
import { logAuditEvent } from '@/lib/audit'
import type { Database } from '@/types/database'

const SubmitSchema = z.object({
  action: z.enum(['SUBMIT', 'APPROVE', 'REJECT']),
  review_note: z.string().optional(),
  outside_grant_reason: z.string().optional(),
})

// PATCH /api/registered-hours/:id — submit (professional) or approve/reject (admin)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return withAuth(request, async (userId, role) => {
    let body: unknown
    try { body = await request.json() } catch { return badRequest('Invalid JSON') }

    const parsed = SubmitSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.issues.map(e => e.message).join(', '))

    const { action } = parsed.data

    if (action !== 'SUBMIT' && role !== 'admin') return forbidden()

    const { createClient } = await import('@/lib/supabase/server')
    const db = await createClient()

    const { data: existing, error: fetchError } = await db
      .from('registered_hours')
      .select('id, status, professional_id')
      .eq('id', id)
      .single()

    if (fetchError || !existing) return notFound('Registered hours entry')

    if (action === 'SUBMIT') {
      if (role !== 'admin' && existing.professional_id !== userId) return forbidden()
      if (existing.status !== 'PENDING') return badRequest('Only PENDING entries can be submitted')
    }

    if (action === 'APPROVE' && existing.status !== 'SUBMITTED') {
      return badRequest('Only SUBMITTED entries can be approved')
    }

    if (action === 'REJECT' && existing.status !== 'SUBMITTED') {
      return badRequest('Only SUBMITTED entries can be rejected')
    }

    type HoursUpdate = Database['public']['Tables']['registered_hours']['Update']
    const updateMap: Record<string, HoursUpdate> = {
      SUBMIT: { status: 'SUBMITTED', submitted_at: new Date().toISOString() },
      APPROVE: {
        status: 'APPROVED',
        reviewed_by: userId,
        reviewed_at: new Date().toISOString(),
        review_note: parsed.data.review_note || null,
      },
      REJECT: {
        status: 'REJECTED',
        reviewed_by: userId,
        reviewed_at: new Date().toISOString(),
        review_note: parsed.data.review_note || null,
        outside_grant_reason: parsed.data.outside_grant_reason || null,
      },
    }

    const { data, error } = await db
      .from('registered_hours')
      .update({ ...updateMap[action], updated_by: userId, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error || !data) return serverError(error?.message)

    await logAuditEvent(db, {
      event_type: `HOURS_${action}ED` as 'HOURS_SUBMITTED' | 'HOURS_APPROVED' | 'HOURS_REJECTED',
      actor_id: userId,
      resource_type: 'registered_hours',
      resource_id: id,
      metadata: { action, review_note: parsed.data.review_note },
    })

    return ok(data)
  })
}
