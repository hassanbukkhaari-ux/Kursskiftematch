import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, created, badRequest, forbidden, serverError, withAuth } from '@/lib/api-response'
import { logAuditEvent } from '@/lib/audit'

const CreateHoursSchema = z.object({
  case_id: z.string().uuid(),
  work_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'work_date must be YYYY-MM-DD'),
  work_type: z.enum(['DIRECT_SESSION', 'TRANSPORT', 'DOCUMENTATION', 'COORDINATION', 'CRISIS_RESPONSE', 'TRAINING', 'OTHER']),
  hours: z.number().min(0.25).max(8),
  session_log_id: z.string().uuid().optional(),
  grant_period_id: z.string().uuid().optional(),
  description: z.string().optional(),
})

// GET /api/registered-hours — admin sees all, professionals see own
export async function GET(request: NextRequest) {
  return withAuth(request, async (userId, role) => {
    const { createClient } = await import('@/lib/supabase/server')
    const db = await createClient()
    const { searchParams } = new URL(request.url)
    const case_id = searchParams.get('case_id')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = db
      .from('registered_hours')
      .select('*', { count: 'exact' })
      .order('work_date', { ascending: false })
      .range(offset, offset + limit - 1)

    if (role !== 'admin') {
      query = query.eq('professional_id', userId)
    }
    if (case_id) query = query.eq('case_id', case_id)
    if (status) query = query.eq('status', status as 'PENDING' | 'SUBMITTED' | 'APPROVED' | 'REJECTED' | 'OUTSIDE_GRANT')

    const { data, error, count } = await query
    if (error) return serverError()
    return ok({ data, count, limit, offset })
  })
}

// POST /api/registered-hours — professional registers hours (WF-006)
export async function POST(request: NextRequest) {
  return withAuth(request, async (userId, role) => {
    let body: unknown
    try { body = await request.json() } catch { return badRequest('Invalid JSON') }

    const parsed = CreateHoursSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.issues.map(e => e.message).join(', '))

    const { createClient } = await import('@/lib/supabase/server')
    const db = await createClient()

    // Verify professional is assigned to this case
    if (role !== 'admin') {
      const { data: assignment } = await db
        .from('case_assignments')
        .select('id')
        .eq('case_id', parsed.data.case_id)
        .eq('professional_id', userId)
        .is('ended_at', null)
        .single()

      if (!assignment) return forbidden()
    }

    const { data, error } = await db
      .from('registered_hours')
      .insert({
        case_id: parsed.data.case_id,
        professional_id: userId,
        work_date: parsed.data.work_date,
        work_type: parsed.data.work_type,
        hours: parsed.data.hours,
        session_log_id: parsed.data.session_log_id || null,
        grant_period_id: parsed.data.grant_period_id || null,
        description: parsed.data.description || null,
        status: 'PENDING',
        created_by: userId,
      })
      .select()
      .single()

    if (error) return serverError(error.message)

    await logAuditEvent(db, {
      event_type: 'HOURS_REGISTERED',
      actor_id: userId,
      resource_type: 'registered_hours',
      resource_id: data.id,
      metadata: { case_id: parsed.data.case_id, hours: parsed.data.hours, work_type: parsed.data.work_type },
    })

    return created(data)
  })
}
