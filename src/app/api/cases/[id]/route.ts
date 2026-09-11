import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, notFound, badRequest, forbidden, serverError, withAuth, withAdminAuth } from '@/lib/api-response'
import { logAuditEvent } from '@/lib/audit'
import type { Database } from '@/types/database'

const UpdateCaseSchema = z.object({
  status: z.enum(['OPEN', 'MATCHED', 'ACTIVE', 'COMPLETED', 'ARCHIVED']).optional(),
  weekly_hours: z.number().min(0).optional(),
  complexity_level: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  citizen_notes: z.string().optional(),
  data_retention_expires_at: z.string().datetime().optional(),
  municipality_id: z.string().uuid().optional(),
  intake_contact_name: z.string().nullable().optional(),
  intake_contact_email: z.string().email().nullable().optional(),
  intake_contact_phone: z.string().nullable().optional(),
})

const ADMIN_ONLY_FIELDS = ['status', 'complexity_level', 'data_retention_expires_at', 'municipality_id', 'intake_contact_name', 'intake_contact_email', 'intake_contact_phone']

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return withAuth(request, async (userId, role) => {
    const { createClient } = await import('@/lib/supabase/server')
    const db = await createClient()

    const { data, error } = await db
      .from('v_cases_with_professional')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) return notFound('Case')

    // Professionals may only see cases they are assigned to
    if (role !== 'admin' && data.professional_id !== userId) return forbidden()

    return ok(data)
  })
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return withAuth(request, async (userId, role) => {
    let body: unknown
    try { body = await request.json() } catch { return badRequest('Invalid JSON') }

    const parsed = UpdateCaseSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.issues.map(e => e.message).join(', '))

    if (role !== 'admin') {
      const attempted = Object.keys(parsed.data).filter(k => ADMIN_ONLY_FIELDS.includes(k))
      if (attempted.length > 0) return forbidden()
    }

    const { createClient } = await import('@/lib/supabase/server')
    const db = await createClient()

    const update: Database['public']['Tables']['cases']['Update'] = {
      ...parsed.data,
      updated_at: new Date().toISOString(),
      ...(parsed.data.status === 'ARCHIVED' && role === 'admin'
        ? { archived_at: new Date().toISOString() }
        : {}),
    }

    const { data, error } = await db
      .from('cases')
      .update(update)
      .eq('id', id)
      .select()
      .single()

    if (error || !data) return notFound('Case')

    await logAuditEvent(db, {
      event_type: 'CASE_UPDATED',
      actor_id: userId,
      resource_type: 'cases',
      resource_id: id,
      metadata: { updated_fields: Object.keys(parsed.data) },
    })

    return ok(data)
  })
}
