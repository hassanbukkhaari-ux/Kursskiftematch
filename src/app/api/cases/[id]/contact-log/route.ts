import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, created, badRequest, forbidden, notFound, serverError, withAuth } from '@/lib/api-response'
import { logAuditEvent } from '@/lib/audit'

const CreateContactLogSchema = z.object({
  contact_type: z.enum(['PHONE_CALL', 'EMAIL', 'IN_PERSON', 'OTHER']),
  note: z.string().max(1000).nullable().optional(),
  outcome: z.string().max(500).nullable().optional(),
  follow_up_required: z.boolean().optional(),
})

// GET /api/cases/[id]/contact-log — history of contact between the
// contact person and the municipality's sagsbehandler on this case
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return withAuth(request, async (userId, role) => {
    const { createClient } = await import('@/lib/supabase/server')
    const db = await createClient()

    const { data: caseRow, error: caseError } = await db
      .from('v_cases_with_professional')
      .select('id, professional_id')
      .eq('id', id)
      .single()
    if (caseError || !caseRow) return notFound('Case')
    if (role !== 'admin' && caseRow.professional_id !== userId) return forbidden()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (db as any)
      .from('contact_logs')
      .select('id, contact_type, logged_at, note, outcome, follow_up_required, created_at')
      .eq('case_id', id)
      .order('logged_at', { ascending: false })

    if (error) return serverError(error.message)
    return ok(data ?? [])
  })
}

// POST /api/cases/[id]/contact-log — the contact person logs that they
// reached out to (or heard from) the municipality's sagsbehandler, most
// commonly the opstartsmøde right after the case goes active.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return withAuth(request, async (userId, role) => {
    let body: unknown
    try { body = await request.json() } catch { return badRequest('Invalid JSON') }

    const parsed = CreateContactLogSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.issues.map(e => e.message).join(', '))

    const { createClient } = await import('@/lib/supabase/server')
    const db = await createClient()

    const { data: caseRow, error: caseError } = await db
      .from('v_cases_with_professional')
      .select('id, professional_id')
      .eq('id', id)
      .single()
    if (caseError || !caseRow) return notFound('Case')
    if (role !== 'admin' && caseRow.professional_id !== userId) return forbidden()
    if (!caseRow.professional_id) return badRequest('Sagen har ingen tilknyttet kontaktperson endnu.')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (db as any)
      .from('contact_logs')
      .insert({
        case_id: id,
        professional_id: caseRow.professional_id,
        contact_type: parsed.data.contact_type,
        logged_at: new Date().toISOString(),
        logged_by: userId,
        note: parsed.data.note ?? null,
        outcome: parsed.data.outcome ?? null,
        follow_up_required: parsed.data.follow_up_required ?? false,
      })
      .select('id, contact_type, logged_at, note, outcome, follow_up_required, created_at')
      .single()

    if (error || !data) return serverError(error?.message)

    await logAuditEvent(db, {
      event_type: 'STARTUP_CONTACT_LOGGED',
      actor_id: userId,
      resource_type: 'contact_logs',
      resource_id: data.id,
      metadata: { case_id: id, contact_type: parsed.data.contact_type },
    })

    return created(data)
  })
}
