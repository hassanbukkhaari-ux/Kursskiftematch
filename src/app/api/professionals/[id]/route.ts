import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, notFound, badRequest, forbidden, serverError, withAuth } from '@/lib/api-response'
import { logAuditEvent } from '@/lib/audit'
import type { Database } from '@/types/database'

const UpdateProfessionalSchema = z.object({
  profession: z.enum(['TEACHER', 'PEDAGOGUE', 'NURSE', 'PSYCHOLOGIST', 'SOCIAL_WORKER', 'COUNSELOR', 'OTHER']).optional(),
  experience_years: z.number().int().min(0).optional(),
  target_age_groups: z.array(z.string()).optional(),
  max_complexity_level: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  qualifications: z.array(z.string()).optional(),
  capacity_hours_week: z.number().min(0).optional(),
  max_concurrent_cases: z.number().int().min(1).optional(),
  availability_days: z.array(z.string()).optional(),
  availability_status: z.enum(['AVAILABLE', 'PARTIALLY_AVAILABLE', 'UNAVAILABLE']).optional(),
  status: z.enum(['REGISTERED', 'ACTIVE', 'INACTIVE', 'ARCHIVED']).optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  education: z.string().optional(),
  certificates: z.array(z.string()).optional(),
  daily_occupation: z.string().optional(),
  experience_with_genders: z.array(z.enum(['BOYS', 'GIRLS'])).optional(),
  available_from_date: z.string().nullable().optional(),
  availability_note: z.string().nullable().optional(),
})

// Professional-only fields (cannot be changed by professional themselves)
const ADMIN_ONLY_FIELDS = ['status', 'profession', 'experience_years', 'max_complexity_level', 'qualifications']

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return withAuth(request, async (userId, role) => {
    if (role !== 'admin' && userId !== id) return forbidden()

    const { createClient } = await import('@/lib/supabase/server')
    const db = await createClient()

    const { data, error } = await db
      .from('professionals')
      .select(`*, profiles!inner(email, full_name)`)
      .eq('id', id)
      .single()

    if (error || !data) return notFound('Professional')
    return ok(data)
  })
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return withAuth(request, async (userId, role) => {
    if (role !== 'admin' && userId !== id) return forbidden()

    let body: unknown
    try { body = await request.json() } catch { return badRequest('Invalid JSON') }

    const parsed = UpdateProfessionalSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.issues.map(e => e.message).join(', '))

    // Professionals cannot update admin-only fields
    if (role !== 'admin') {
      const attempted = Object.keys(parsed.data).filter(k => ADMIN_ONLY_FIELDS.includes(k))
      if (attempted.length > 0) {
        return forbidden()
      }
    }

    // Standard full-time work week (37 timer) is a hard cap for everyone —
    // admin included, per explicit instruction — not just a default anyone
    // could talk their way past.
    const WEEKLY_HOURS_CAP = 37
    if (parsed.data.capacity_hours_week != null && parsed.data.capacity_hours_week > WEEKLY_HOURS_CAP) {
      return badRequest(`Timer/uge kan maksimalt være ${WEEKLY_HOURS_CAP} (fuld arbejdstid).`)
    }

    const { createClient } = await import('@/lib/supabase/server')
    const db = await createClient()

    // A complexity tier is a claim about how much real-world experience
    // backs it up — self-declared or admin-declared, it shouldn't be
    // reachable on paper alone. Minimum years required per tier: under 1
    // year is only LOW, 1-2 years unlocks MEDIUM, 2+ years unlocks HIGH and
    // CRITICAL (CRITICAL cases still need admin's own judgment beyond this
    // floor — this only blocks the clearly-too-low combinations).
    if (parsed.data.max_complexity_level != null || parsed.data.experience_years != null) {
      const MIN_YEARS_FOR_COMPLEXITY: Record<string, number> = { LOW: 0, MEDIUM: 1, HIGH: 2, CRITICAL: 2 }
      let effectiveComplexity = parsed.data.max_complexity_level
      let effectiveYears = parsed.data.experience_years
      if (effectiveComplexity == null || effectiveYears == null) {
        const { data: existing } = await db
          .from('professionals')
          .select('experience_years, max_complexity_level')
          .eq('id', id)
          .single()
        effectiveComplexity ??= existing?.max_complexity_level
        effectiveYears ??= existing?.experience_years
      }
      if (effectiveComplexity && effectiveYears != null) {
        const required = MIN_YEARS_FOR_COMPLEXITY[effectiveComplexity] ?? 0
        if (effectiveYears < required) {
          return badRequest(`Maks. kompleksitet "${effectiveComplexity}" kræver mindst ${required} års erfaring — fagpersonen har ${effectiveYears}.`)
        }
      }
    }

    type ProfessionalUpdate = Database['public']['Tables']['professionals']['Update']
    const update: ProfessionalUpdate = {
      ...parsed.data,
      updated_at: new Date().toISOString(),
      ...(parsed.data.status === 'ARCHIVED' && role === 'admin'
        ? { archived_at: new Date().toISOString() }
        : {}),
    }

    const { data, error } = await db
      .from('professionals')
      .update(update)
      .eq('id', id)
      .select()
      .single()

    if (error || !data) return notFound('Professional')

    await logAuditEvent(db, {
      event_type: 'PROFESSIONAL_UPDATED',
      actor_id: userId,
      resource_type: 'professionals',
      resource_id: id,
      metadata: { updated_fields: Object.keys(parsed.data) },
    })

    return ok(data)
  })
}
