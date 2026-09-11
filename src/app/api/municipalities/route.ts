import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, created, badRequest, serverError, withAuth, withAdminAuth } from '@/lib/api-response'
import { logAuditEvent } from '@/lib/audit'

const CreateMunicipalitySchema = z.object({
  name: z.string().min(1),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
  sagsbehandler_name: z.string().optional(),
  sagsbehandler_email: z.string().email().optional(),
  sagsbehandler_phone: z.string().optional(),
  secondary_contact_name: z.string().optional(),
  secondary_contact_email: z.string().email().optional(),
  secondary_contact_phone: z.string().optional(),
})

// GET /api/municipalities — any authenticated user
export async function GET(request: NextRequest) {
  return withAuth(request, async (userId, role) => {
    const { createClient } = await import('@/lib/supabase/server')
    const db = await createClient()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    let query = db
      .from('municipalities')
      .select('id, name, status, sagsbehandler_name, sagsbehandler_email')
      .order('name', { ascending: true })

    if (status) query = query.eq('status', status as 'ACTIVE' | 'INACTIVE')

    // Non-admin users only see active municipalities
    if (role !== 'admin') {
      query = query.eq('status', 'ACTIVE')
    }

    const { data, error } = await query
    if (error) return serverError()
    return ok({ data, count: data?.length || 0 })
  })
}

// POST /api/municipalities — admin only
export async function POST(request: NextRequest) {
  return withAdminAuth(request, async (userId) => {
    let body: unknown
    try { body = await request.json() } catch { return badRequest('Invalid JSON') }

    const parsed = CreateMunicipalitySchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.issues.map(e => e.message).join(', '))

    const { createClient } = await import('@/lib/supabase/server')
    const db = await createClient()

    // Unique name check
    const { data: existing } = await db
      .from('municipalities')
      .select('id')
      .ilike('name', parsed.data.name.trim())
      .limit(1)
    if (existing?.length) return badRequest('En kommune med dette navn findes allerede.')

    const { data, error } = await db
      .from('municipalities')
      .insert(parsed.data)
      .select()
      .single()

    if (error) return serverError(error.message)

    await logAuditEvent(db, {
      event_type: 'MUNICIPALITY_CREATED',
      actor_id: userId,
      resource_type: 'municipalities',
      resource_id: data.id,
      metadata: { name: data.name },
    })

    return created(data)
  })
}
