import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, badRequest, forbidden, serverError, withAuth } from '@/lib/api-response'

const UpsertSchema = z.object({
  case_id: z.string().uuid(),
  week_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'week_start must be YYYY-MM-DD'),
  planned_hours: z.number().min(0).max(80),
})

// POST /api/planned-hours — professional sets/clears planned hours for one case + week
export async function POST(request: NextRequest) {
  return withAuth(request, async (userId, role) => {
    if (role !== 'professional') return forbidden()

    let body: unknown
    try { body = await request.json() } catch { return badRequest('Invalid JSON') }

    const parsed = UpsertSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.issues.map(e => e.message).join(', '))

    const { createClient } = await import('@/lib/supabase/server')
    const db = await createClient()

    // Verify the professional is currently assigned to this case
    const { data: assignment } = await db
      .from('case_assignments')
      .select('id')
      .eq('case_id', parsed.data.case_id)
      .eq('professional_id', userId)
      .is('ended_at', null)
      .single()

    if (!assignment) return forbidden()

    // 0 hours means "clear this cell" rather than storing a zero row
    if (parsed.data.planned_hours === 0) {
      const { error } = await db
        .from('planned_hours')
        .delete()
        .eq('case_id', parsed.data.case_id)
        .eq('professional_id', userId)
        .eq('week_start', parsed.data.week_start)

      if (error) return serverError(error.message)
      return ok({ deleted: true })
    }

    const { data, error } = await db
      .from('planned_hours')
      .upsert(
        {
          case_id: parsed.data.case_id,
          professional_id: userId,
          week_start: parsed.data.week_start,
          planned_hours: parsed.data.planned_hours,
          created_by: userId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'case_id,professional_id,week_start' }
      )
      .select()
      .single()

    if (error) return serverError(error.message)
    return ok(data)
  })
}
