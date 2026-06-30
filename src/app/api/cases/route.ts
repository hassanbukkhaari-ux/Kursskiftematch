import { NextRequest } from 'next/server'
import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'
import { ok, created, badRequest, serverError, withAuth, withAdminAuth } from '@/lib/api-response'
import { logAuditEvent } from '@/lib/audit'
import { sendNotification, adminEmailBody } from '@/lib/notifications/service'
import type { Database } from '@/types/database'

const CreateCaseSchema = z.object({
  municipality_id: z.string().uuid(),
  citizen_initials: z.string().length(2),
  citizen_age_range: z.enum(['0-5', '6-12', '13-18', '18+']),
  citizen_gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  citizen_notes: z.string().optional(),
  weekly_hours: z.number().min(0).default(0),
  complexity_level: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).default('LOW'),
  inquiry_id: z.string().uuid().optional(),
  problem_area_codes: z.array(z.string()).optional(),
  goal_codes: z.array(z.string()).optional(),
  special_wish_codes: z.array(z.string()).optional(),
})

export async function GET(request: NextRequest) {
  return withAuth(request, async (userId, role) => {
    const { createClient } = await import('@/lib/supabase/server')
    const db = await createClient()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const municipality_id = searchParams.get('municipality_id')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    if (role !== 'admin') {
      const { data, error } = await db
        .from('v_cases_with_professional')
        .select('*')
        .eq('professional_id', userId)
        .order('id', { ascending: false })
        .range(offset, offset + limit - 1)
      if (error) return serverError()
      return ok({ data, count: data?.length || 0, limit, offset })
    }

    let query = db.from('v_cases_with_professional').select('*', { count: 'exact' })
    if (status) query = query.eq('status', status as 'OPEN' | 'MATCHED' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED')
    if (municipality_id) query = query.eq('municipality_id', municipality_id)
    query = query.order('id', { ascending: false }).range(offset, offset + limit - 1)

    const { data, error, count } = await query
    if (error) return serverError()
    return ok({ data, count, limit, offset })
  })
}

export async function POST(request: NextRequest) {
  return withAdminAuth(request, async (userId) => {
    const { createClient } = await import('@/lib/supabase/server')
    const db = await createClient()

    let body: unknown
    try { body = await request.json() } catch { return badRequest('Invalid JSON') }

    const parsed = CreateCaseSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.issues.map(e => e.message).join(', '))

    const { inquiry_id, problem_area_codes, goal_codes, special_wish_codes, ...caseData } = parsed.data

    const { data: newCase, error } = await db.from('cases').insert(caseData).select().single()
    if (error || !newCase) return serverError(error?.message)

    await Promise.all([
      linkProblemAreas(db, newCase.id, problem_area_codes),
      linkGoals(db, newCase.id, goal_codes),
      linkSpecialWishes(db, newCase.id, special_wish_codes),
    ])

    await logAuditEvent(db, {
      event_type: 'CASE_CREATED',
      actor_id: userId,
      resource_type: 'cases',
      resource_id: newCase.id,
      metadata: { citizen_initials: newCase.citizen_initials, municipality_id: newCase.municipality_id },
    })

    if (inquiry_id) {
      await db.from('inbound_inquiries').update({
        status: 'CONVERTED',
        converted_to_type: 'case',
        converted_to_id: newCase.id,
        reviewed_by: userId,
        reviewed_at: new Date().toISOString(),
      }).eq('id', inquiry_id)
    }

    const { subject, body: emailBody } = adminEmailBody('CASE_CREATED', newCase.id)
    await sendNotification({
      db,
      notification_type: 'CASE_CREATED',
      related_entity_type: 'cases',
      related_entity_id: newCase.id,
      recipient_email: process.env.SYSTEM_ADMIN_EMAIL,
      subject,
      body: emailBody,
    })

    return created(newCase)
  })
}

async function linkProblemAreas(db: SupabaseClient<Database>, caseId: string, codes?: string[]) {
  if (!codes || codes.length === 0) return
  const { data: lookups } = await db.from('problem_areas').select('id, code').in('code', codes)
  if (!lookups || lookups.length === 0) return
  await db.from('case_problem_areas').insert(lookups.map(l => ({ case_id: caseId, problem_area_id: l.id })))
}

async function linkGoals(db: SupabaseClient<Database>, caseId: string, codes?: string[]) {
  if (!codes || codes.length === 0) return
  const { data: lookups } = await db.from('goals_lookup').select('id, code').in('code', codes)
  if (!lookups || lookups.length === 0) return
  await db.from('case_goals').insert(lookups.map(l => ({ case_id: caseId, goal_id: l.id })))
}

async function linkSpecialWishes(db: SupabaseClient<Database>, caseId: string, codes?: string[]) {
  if (!codes || codes.length === 0) return
  const { data: lookups } = await db.from('special_wishes_lookup').select('id, code').in('code', codes)
  if (!lookups || lookups.length === 0) return
  await db.from('case_special_wishes').insert(lookups.map(l => ({ case_id: caseId, special_wish_id: l.id })))
}
