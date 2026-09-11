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
    const { createClient } = await import('@/lib/supabase/server')
    const db = await createClient()

    // Block if any cases (active or otherwise) are linked
    const { data: linkedCases } = await db
      .from('cases')
      .select('id')
      .eq('municipality_id', id)
      .limit(1)

    if (linkedCases?.length) {
      return badRequest('Kommunen har tilknyttede sager og kan ikke slettes. Overfør eller afslut sagerne først.')
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
      metadata: {},
    })

    return ok({ ok: true })
  })
}
