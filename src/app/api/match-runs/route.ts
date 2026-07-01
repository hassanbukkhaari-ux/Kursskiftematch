import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, created, badRequest, notFound, serverError, withAdminAuth } from '@/lib/api-response'
import { logAuditEvent } from '@/lib/audit'
import { runMatchForCase } from '@/lib/matching/run-match'

const TriggerMatchRunSchema = z.object({
  case_id: z.string().uuid(),
})

// GET /api/match-runs — admin only, list all match runs
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    const { createClient } = await import('@/lib/supabase/server')
    const db = await createClient()
    const { searchParams } = new URL(request.url)
    const case_id = searchParams.get('case_id')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = db
      .from('match_runs')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (case_id) query = query.eq('case_id', case_id)

    const { data, error, count } = await query
    if (error) return serverError()
    return ok({ data, count, limit, offset })
  })
}

// POST /api/match-runs — admin only, trigger a new match run (WF-003)
export async function POST(request: NextRequest) {
  return withAdminAuth(request, async (userId) => {
    let body: unknown
    try { body = await request.json() } catch { return badRequest('Invalid JSON') }

    const parsed = TriggerMatchRunSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.issues.map(e => e.message).join(', '))

    const { createClient } = await import('@/lib/supabase/server')
    const db = await createClient()

    const { data: caseRow } = await db.from('cases').select('id').eq('id', parsed.data.case_id).single()
    if (!caseRow) return notFound('Case')

    let result: Awaited<ReturnType<typeof runMatchForCase>>
    try {
      result = await runMatchForCase(db, parsed.data.case_id, userId)
    } catch (err) {
      return serverError(err instanceof Error ? err.message : undefined)
    }

    if (result.status === 'CANCELLED') return serverError('Match run cancelled — check professionals availability')

    await logAuditEvent(db, {
      event_type: 'MATCH_RUN_COMPLETED',
      actor_id: userId,
      resource_type: 'match_runs',
      resource_id: result.runId,
      metadata: { case_id: parsed.data.case_id, candidates_evaluated: result.candidateCount },
    })

    const { data: run } = await db.from('match_runs').select('*').eq('id', result.runId).single()
    return created(run)
  })
}
