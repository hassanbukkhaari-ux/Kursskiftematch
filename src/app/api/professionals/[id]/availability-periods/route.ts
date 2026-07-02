import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, created, badRequest, forbidden, notFound, serverError, withAuth } from '@/lib/api-response'
import { logAuditEvent } from '@/lib/audit'

const CreatePeriodSchema = z.object({
  period_type: z.enum(['VACATION', 'PAUSE']),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'start_date must be YYYY-MM-DD'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'end_date must be YYYY-MM-DD').nullable().optional(),
  note: z.string().max(500).nullable().optional(),
})

// GET /api/professionals/[id]/availability-periods
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return withAuth(request, async (userId, role) => {
    if (role !== 'admin' && userId !== id) return forbidden()

    const { createClient } = await import('@/lib/supabase/server')
    const db = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dba = db as any

    const { data, error } = await dba
      .from('professional_availability_periods')
      .select('id, period_type, start_date, end_date, note, created_at')
      .eq('professional_id', id)
      .order('start_date', { ascending: true })

    if (error) return serverError(error.message)
    return ok(data ?? [])
  })
}

// POST /api/professionals/[id]/availability-periods
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return withAuth(request, async (userId, role) => {
    if (role !== 'admin' && userId !== id) return forbidden()

    let body: unknown
    try { body = await request.json() } catch { return badRequest('Invalid JSON') }

    const parsed = CreatePeriodSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.issues.map(e => e.message).join(', '))

    if (parsed.data.end_date && parsed.data.end_date < parsed.data.start_date) {
      return badRequest('end_date cannot be before start_date')
    }

    const { createClient } = await import('@/lib/supabase/server')
    const db = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dba = db as any

    // Verify professional exists
    const { data: pro } = await db.from('professionals').select('id').eq('id', id).single()
    if (!pro) return notFound('Professional')

    const { data, error } = await dba
      .from('professional_availability_periods')
      .insert({
        professional_id: id,
        period_type: parsed.data.period_type,
        start_date: parsed.data.start_date,
        end_date: parsed.data.end_date ?? null,
        note: parsed.data.note ?? null,
        created_by: userId,
      })
      .select('id, period_type, start_date, end_date, note, created_at')
      .single()

    if (error || !data) return serverError(error?.message)

    await logAuditEvent(db, {
      event_type: 'PROFESSIONAL_UPDATED',
      actor_id: userId,
      resource_type: 'professionals',
      resource_id: id,
      metadata: { action: 'availability_period_added', period_type: parsed.data.period_type, start_date: parsed.data.start_date },
    })

    return created(data)
  })
}
