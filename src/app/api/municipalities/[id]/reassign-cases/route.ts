import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, badRequest, withAdminAuth } from '@/lib/api-response'
import { logAuditEvent } from '@/lib/audit'

const Schema = z.object({
  target_municipality_id: z.string().uuid(),
})

// POST /api/municipalities/[id]/reassign-cases
// Bulk-moves all cases (and their grants) from this municipality to another
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return withAdminAuth(request, async (userId) => {
    let body: unknown
    try { body = await request.json() } catch { return badRequest('Invalid JSON') }

    const parsed = Schema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.issues.map(e => e.message).join(', '))

    const { target_municipality_id } = parsed.data

    if (target_municipality_id === id) return badRequest('Mål-kommunen er den samme som kilde-kommunen.')

    const { createServiceClient } = await import('@/lib/supabase/server')
    const db = createServiceClient()

    // Verify target municipality exists
    const { data: target } = await db
      .from('municipalities')
      .select('id, name')
      .eq('id', target_municipality_id)
      .single()

    if (!target) return badRequest('Mål-kommunen findes ikke.')

    // Move cases
    const { data: movedCases, error: casesError } = await db
      .from('cases')
      .update({ municipality_id: target_municipality_id, updated_at: new Date().toISOString() })
      .eq('municipality_id', id)
      .select('id')

    if (casesError) return badRequest(casesError.message)

    // Move case_grants for the same municipality
    await (db as any)
      .from('case_grants')
      .update({ municipality_id: target_municipality_id })
      .eq('municipality_id', id)

    const count = movedCases?.length ?? 0

    await logAuditEvent(db, {
      event_type: 'MUNICIPALITY_UPDATED',
      actor_id: userId,
      resource_type: 'municipalities',
      resource_id: id,
      metadata: { action: 'bulk_reassign_cases', target_municipality_id, cases_moved: count },
    })

    return ok({ moved: count, target_name: target.name })
  })
}
