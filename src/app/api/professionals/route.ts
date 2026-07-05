import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, created, badRequest, forbidden, serverError, withAuth, withAdminAuth } from '@/lib/api-response'
import { logAuditEvent } from '@/lib/audit'

const CreateProfessionalSchema = z.object({
  profile_id: z.string().uuid(),
  profession: z.enum(['TEACHER', 'PEDAGOGUE', 'NURSE', 'PSYCHOLOGIST', 'SOCIAL_WORKER', 'COUNSELOR', 'OTHER']),
  experience_years: z.number().int().min(0).default(0),
  target_age_groups: z.array(z.enum(['0-5', '6-12', '13-18', '18+'])).default([]),
  max_complexity_level: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('MEDIUM'),
  qualifications: z.array(z.string()).default([]),
  capacity_hours_week: z.number().min(0).default(0),
  max_concurrent_cases: z.number().int().min(1).default(3),
  availability_days: z.array(z.string()).default([]),
})

// GET /api/professionals — admin sees all, professionals see only self
export async function GET(request: NextRequest) {
  return withAuth(request, async (userId, role) => {
    const { createClient } = await import('@/lib/supabase/server')
    const db = await createClient()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const profession = searchParams.get('profession')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (role !== 'admin') {
      // Professional sees only their own profile
      const { data, error } = await db
        .from('professionals')
        .select(`*, profiles!inner(email, full_name)`)
        .eq('id', userId)
        .single()
      if (error || !data) return ok({ data: [], count: 0 })
      return ok({ data: [data], count: 1 })
    }

    let query = db
      .from('professionals')
      .select(`*, profiles!inner(email, full_name)`, { count: 'exact' })

    if (status) query = query.eq('status', status as 'REGISTERED' | 'ACTIVE' | 'INACTIVE' | 'ARCHIVED')
    if (profession) query = query.eq('profession', profession as 'TEACHER' | 'PEDAGOGUE' | 'NURSE' | 'PSYCHOLOGIST' | 'SOCIAL_WORKER' | 'COUNSELOR' | 'OTHER')

    query = query.order('created_at', { ascending: false }).range(offset, offset + limit - 1)

    const { data, error, count } = await query
    if (error) return serverError()
    return ok({ data, count, limit, offset })
  })
}

// POST /api/professionals — admin only (creates professional record for an existing profile)
export async function POST(request: NextRequest) {
  return withAdminAuth(request, async (userId) => {
    const { createClient } = await import('@/lib/supabase/server')
    const db = await createClient()

    let body: unknown
    try { body = await request.json() } catch { return badRequest('Invalid JSON') }

    const parsed = CreateProfessionalSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.issues.map(e => e.message).join(', '))

    const { profile_id, ...rest } = parsed.data

    // Verify profile exists and has role=professional
    const { data: profile } = await db.from('profiles').select('role').eq('id', profile_id).single()
    if (!profile) return badRequest('Profile not found')
    if (profile.role !== 'professional') return badRequest('Profile must have role=professional')

    const { data, error } = await db
      .from('professionals')
      .insert({ id: profile_id, ...rest })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') return badRequest('Professional profile already exists for this user')
      return serverError(error.message)
    }

    await logAuditEvent(db, {
      event_type: 'PROFESSIONAL_CREATED',
      actor_id: userId,
      resource_type: 'professionals',
      resource_id: data.id,
      metadata: { profession: data.profession },
    })

    return created(data)
  })
}
