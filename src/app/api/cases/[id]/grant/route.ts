import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, created, badRequest, notFound, forbidden, serverError, withAuth, withAdminAuth } from '@/lib/api-response'
import { logAuditEvent } from '@/lib/audit'

const CreateGrantSchema = z.object({
  granted_hours: z.number().positive(),
  period_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  period_end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

// GET /api/cases/:id/grant — list all grants for case (admin or assigned professional)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return withAuth(request, async (userId, role) => {
    const { createClient } = await import('@/lib/supabase/server')
    const db = await createClient()

    // Professionals may only view grants for their assigned cases
    if (role !== 'admin') {
      const { data: assignment } = await db
        .from('case_assignments')
        .select('id')
        .eq('case_id', id)
        .eq('professional_id', userId)
        .is('ended_at', null)
        .single()
      if (!assignment) return forbidden()
    }

    const { data, error } = await db
      .from('case_grants')
      .select('*')
      .eq('case_id', id)
      .order('period_start', { ascending: false })

    if (error) return serverError(error.message)
    return ok(data ?? [])
  })
}

// POST /api/cases/:id/grant — create new grant (admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return withAdminAuth(request, async (userId) => {
    let body: unknown
    try { body = await request.json() } catch { return badRequest('Invalid JSON') }

    const parsed = CreateGrantSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.issues.map(e => e.message).join(', '))

    if (parsed.data.period_end <= parsed.data.period_start) {
      return badRequest('period_end must be after period_start')
    }

    const { createClient } = await import('@/lib/supabase/server')
    const db = await createClient()

    // Verify case exists and get municipality_id
    const { data: caseData, error: caseError } = await db
      .from('cases')
      .select('id, municipality_id, status')
      .eq('id', id)
      .single()

    if (caseError || !caseData) return notFound('Case')
    if (caseData.status === 'ARCHIVED') return badRequest('Cannot add grant to archived case')

    const { data, error } = await db
      .from('case_grants')
      .insert({
        case_id: id,
        municipality_id: caseData.municipality_id,
        granted_hours: parsed.data.granted_hours,
        period_start: parsed.data.period_start,
        period_end: parsed.data.period_end,
        status: 'PENDING',
        created_by: userId,
      })
      .select()
      .single()

    if (error || !data) return serverError(error?.message)

    await logAuditEvent(db, {
      event_type: 'GRANT_CREATED',
      actor_id: userId,
      resource_type: 'case_grants',
      resource_id: data.id,
      metadata: {
        case_id: id,
        granted_hours: parsed.data.granted_hours,
        period_start: parsed.data.period_start,
        period_end: parsed.data.period_end,
      },
    })

    return created(data)
  })
}
