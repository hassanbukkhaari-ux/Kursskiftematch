import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, notFound, badRequest, forbidden, serverError, withAuth, withAdminAuth } from '@/lib/api-response'
import { logAuditEvent } from '@/lib/audit'
import { syncProblemAreas, syncGoals, syncSpecialWishes } from '@/lib/cases/case-tags'
import type { Database } from '@/types/database'

const UpdateCaseSchema = z.object({
  status: z.enum(['OPEN', 'MATCHED', 'ACTIVE', 'COMPLETED', 'ARCHIVED']).optional(),
  weekly_hours: z.number().min(0).optional(),
  complexity_level: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
  urgency: z.enum(['NORMAL', 'HURTIG', 'AKUT']).optional(),
  citizen_notes: z.string().optional(),
  data_retention_expires_at: z.string().datetime().optional(),
  municipality_id: z.string().uuid().optional(),
  intake_contact_name: z.string().nullable().optional(),
  intake_contact_email: z.string().email().nullable().optional(),
  intake_contact_phone: z.string().nullable().optional(),
  // One-shot intake fields — originally only ever set at case creation,
  // with no way back if something was wrong or changed since.
  citizen_gender: z.enum(['MALE', 'FEMALE', 'OTHER']).nullable().optional(),
  legal_basis: z.enum(['BARNETS_LOV_32', 'SEL_76', 'SEL_85', 'SEL_99']).nullable().optional(),
  expected_duration_months: z.number().int().min(1).nullable().optional(),
  diagnoses: z.string().nullable().optional(),
  daily_function: z.string().nullable().optional(),
  citizen_interests: z.string().nullable().optional(),
  preferred_prof_gender: z.enum(['MALE', 'FEMALE', 'NO_PREF']).nullable().optional(),
  required_languages: z.array(z.string()).nullable().optional(),
  transport_needs: z.enum(['JA', 'NEJ']).nullable().optional(),
  geographical_area: z.string().nullable().optional(),
  requires_evening: z.boolean().optional(),
  requires_weekend: z.boolean().optional(),
  requires_night: z.boolean().optional(),
  problem_area_codes: z.array(z.string()).optional(),
  goal_codes: z.array(z.string()).optional(),
  special_wish_codes: z.array(z.string()).optional(),
})

const ADMIN_ONLY_FIELDS = [
  'status', 'complexity_level', 'urgency', 'data_retention_expires_at', 'municipality_id',
  'intake_contact_name', 'intake_contact_email', 'intake_contact_phone',
  'citizen_gender', 'legal_basis', 'expected_duration_months', 'diagnoses', 'daily_function',
  'citizen_interests', 'preferred_prof_gender', 'required_languages', 'transport_needs',
  'geographical_area', 'requires_evening', 'requires_weekend', 'requires_night',
  'problem_area_codes', 'goal_codes', 'special_wish_codes',
]

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

    const { problem_area_codes, goal_codes, special_wish_codes, ...caseFields } = parsed.data

    const update: Database['public']['Tables']['cases']['Update'] = {
      ...caseFields,
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

    await Promise.all([
      syncProblemAreas(db, id, problem_area_codes),
      syncGoals(db, id, goal_codes),
      syncSpecialWishes(db, id, special_wish_codes),
    ])

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
