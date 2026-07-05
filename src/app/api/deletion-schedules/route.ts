import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, created, badRequest, serverError, withAdminAuth } from '@/lib/api-response'

const CreateDeletionScheduleSchema = z.object({
  record_type: z.string().min(1),
  record_id: z.string().uuid(),
  scheduled_for_deletion_at: z.string().datetime(),
  retention_expired_at: z.string().datetime(),
  reason: z.enum(['RETENTION_EXPIRED', 'USER_REQUEST', 'LEGAL_REQUIREMENT']),
})

// GET /api/deletion-schedules — admin only
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    const { createClient } = await import('@/lib/supabase/server')
    const db = await createClient()
    const { searchParams } = new URL(request.url)
    const pending_only = searchParams.get('pending_only') === 'true'
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = db
      .from('deletion_schedules')
      .select('*', { count: 'exact' })
      .order('scheduled_for_deletion_at', { ascending: true })
      .range(offset, offset + limit - 1)

    if (pending_only) {
      query = query.is('executed_at', null)
    }

    const { data, error, count } = await query
    if (error) return serverError()
    return ok({ data, count, limit, offset })
  })
}

// POST /api/deletion-schedules — admin only (WF-013)
export async function POST(request: NextRequest) {
  return withAdminAuth(request, async () => {
    let body: unknown
    try { body = await request.json() } catch { return badRequest('Invalid JSON') }

    const parsed = CreateDeletionScheduleSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.issues.map(e => e.message).join(', '))

    const { createClient } = await import('@/lib/supabase/server')
    const db = await createClient()

    const { data, error } = await db
      .from('deletion_schedules')
      .insert(parsed.data)
      .select()
      .single()

    if (error) return serverError(error.message)
    return created(data)
  })
}
