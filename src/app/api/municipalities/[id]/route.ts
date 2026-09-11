import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, notFound, badRequest, serverError, withAdminAuth } from '@/lib/api-response'
import { logAuditEvent } from '@/lib/audit'

const UpdateMunicipalitySchema = z.object({
  name: z.string().min(1).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  sagsbehandler_name: z.string().optional(),
  sagsbehandler_email: z.string().email().optional(),
  sagsbehandler_phone: z.string().optional(),
})

const DeleteMunicipalitySchema = z.object({
  reassign_to: z.string().uuid().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return withAdminAuth(request, async (userId) => {
    let body: unknown
    try { body = await request.json() } catch { return badRequest('Invalid JSON') }

    const parsed = UpdateMunicipalitySchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.issues.map(e => e.message).join(', '))

    const { createClient } = await import('@/lib/supabase/server')
    const db = await createClient()

    // Unique name check when renaming
    if (parsed.data.name) {
      const { data: existing } = await db
        .from('municipalities')
        .select('id')
        .ilike('name', parsed.data.name.trim())
        .neq('id', id)
        .limit(1)
      if (existing?.length) return badRequest('En kommune med dette navn findes allerede.')
    }

    const { data, error } = await db
      .from('municipalities')
      .update({ ...parsed.data, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error || !data) return notFound('Municipality')

    await logAuditEvent(db, {
      event_type: 'MUNICIPALITY_UPDATED',
      actor_id: userId,
      resource_type: 'municipalities',
      resource_id: id,
      metadata: { updated_fields: Object.keys(parsed.data) },
    })

    return ok(data)
  })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return withAdminAuth(request, async (userId) => {
    // Parse optional reassign_to from body
    let reassign_to: string | undefined
    try {
      const body = await request.json().catch(() => ({}))
      const parsed = DeleteMunicipalitySchema.safeParse(body)
      if (parsed.success) reassign_to = parsed.data.reassign_to
    } catch { /* no body is fine */ }

    const { createServiceClient } = await import('@/lib/supabase/server')
    const db = createServiceClient()

    // Check for linked cases
    const { data: linkedCases } = await db
      .from('cases')
      .select('id')
      .eq('municipality_id', id)

    const caseCount = linkedCases?.length ?? 0

    if (caseCount > 0) {
      if (!reassign_to) {
        return badRequest(`Kommunen har ${caseCount} tilknyttede sager og kan ikke slettes direkte.`)
      }
      if (reassign_to === id) {
        return badRequest('Mål-kommunen er den samme som kilde-kommunen.')
      }

      // Verify target exists
      const { data: target } = await db
        .from('municipalities')
        .select('id')
        .eq('id', reassign_to)
        .single()
      if (!target) return badRequest('Mål-kommunen findes ikke.')

      // Reassign cases and grants atomically
      const { error: casesErr } = await db
        .from('cases')
        .update({ municipality_id: reassign_to, updated_at: new Date().toISOString() })
        .eq('municipality_id', id)
      if (casesErr) return serverError(casesErr.message)

      await (db as any)
        .from('case_grants')
        .update({ municipality_id: reassign_to })
        .eq('municipality_id', id)
    }

    // Check for any remaining grants (edge case: grants without cases)
    const { data: remainingGrants } = await (db as any)
      .from('case_grants')
      .select('id')
      .eq('municipality_id', id)
      .limit(1)

    if (remainingGrants?.length) {
      return badRequest('Kommunen har tilknyttede bevillinger der ikke kunne flyttes. Kontakt support.')
    }

    const { error } = await db
      .from('municipalities')
      .delete()
      .eq('id', id)

    if (error) return serverError(error.message)

    await logAuditEvent(db, {
      event_type: 'MUNICIPALITY_DELETED',
      actor_id: userId,
      resource_type: 'municipalities',
      resource_id: id,
      metadata: { cases_reassigned: caseCount, reassigned_to: reassign_to ?? null },
    })

    return ok({ ok: true, cases_reassigned: caseCount })
  })
}
