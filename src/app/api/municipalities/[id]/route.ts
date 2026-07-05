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
  secondary_contact_name: z.string().optional(),
  secondary_contact_email: z.string().email().optional(),
  secondary_contact_phone: z.string().optional(),
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
