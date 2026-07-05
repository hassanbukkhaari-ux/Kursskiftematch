import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, created, notFound, badRequest, forbidden, serverError, withAuth } from '@/lib/api-response'
import { logAuditEvent } from '@/lib/audit'

const CreateCorrectionSchema = z.object({
  correction_note: z.string().min(1),
  correction_reason: z.enum(['TYPO', 'WRONG_TIME', 'CLARIFICATION', 'OMISSION', 'SAFEGUARDING', 'OTHER']),
})

// GET /api/session-logs/:id/corrections
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return withAuth(request, async (userId, role) => {
    const { createClient } = await import('@/lib/supabase/server')
    const db = await createClient()

    const { data: log, error: logError } = await db
      .from('session_logs')
      .select('id, professional_id')
      .eq('id', id)
      .single()

    if (logError || !log) return notFound('Session log')
    if (role !== 'admin' && log.professional_id !== userId) return forbidden()

    const { data, error } = await db
      .from('session_log_corrections')
      .select('*')
      .eq('session_log_id', id)
      .order('created_at', { ascending: false })

    if (error) return serverError()
    return ok(data)
  })
}

// POST /api/session-logs/:id/corrections — immutable correction record
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return withAuth(request, async (userId, role) => {
    let body: unknown
    try { body = await request.json() } catch { return badRequest('Invalid JSON') }

    const parsed = CreateCorrectionSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.issues.map(e => e.message).join(', '))

    const { createClient } = await import('@/lib/supabase/server')
    const db = await createClient()

    const { data: log, error: logError } = await db
      .from('session_logs')
      .select('id, professional_id, status')
      .eq('id', id)
      .single()

    if (logError || !log) return notFound('Session log')
    if (role !== 'admin' && log.professional_id !== userId) return forbidden()
    if (log.status !== 'FINAL' && log.status !== 'CORRECTED') {
      return badRequest('Corrections can only be added to FINAL or CORRECTED logs')
    }

    const { data, error } = await db
      .from('session_log_corrections')
      .insert({
        session_log_id: id,
        correction_note: parsed.data.correction_note,
        correction_reason: parsed.data.correction_reason,
        created_by: userId,
      })
      .select()
      .single()

    if (error) return serverError(error.message)

    // Mark session log as CORRECTED
    await db
      .from('session_logs')
      .update({ status: 'CORRECTED' })
      .eq('id', id)

    await logAuditEvent(db, {
      event_type: 'SESSION_LOG_CORRECTED',
      actor_id: userId,
      resource_type: 'session_logs',
      resource_id: id,
      metadata: { correction_id: data.id, correction_reason: parsed.data.correction_reason },
    })

    return created(data)
  })
}
