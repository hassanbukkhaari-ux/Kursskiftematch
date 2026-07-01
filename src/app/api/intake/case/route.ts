import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, badRequest, serverError } from '@/lib/api-response'
import { logAuditEvent } from '@/lib/audit'
import { runMatchForCase } from '@/lib/matching/run-match'
import { sendNotification, adminEmailBody } from '@/lib/notifications/service'

const IntakeCaseSchema = z.object({
  municipality_id: z.string().uuid(),
  contact_name: z.string().min(1),
  contact_email: z.string().email(),
  citizen_initials: z.string().min(1).max(10),
  citizen_age_range: z.enum(['0-17', '18-30', '31-50', '51-65', '65+']),
  citizen_gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'UNKNOWN']).optional(),
  weekly_hours: z.number().positive(),
  complexity_level: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  citizen_notes: z.string().optional(),
  problem_area_ids: z.array(z.string().uuid()).optional(),
  goal_ids: z.array(z.string().uuid()).optional(),
  special_wish_ids: z.array(z.string().uuid()).optional(),
})

// POST /api/intake/case — public, no auth (service role)
export async function POST(request: NextRequest) {
  let body: unknown
  try { body = await request.json() } catch { return badRequest('Invalid JSON') }

  const parsed = IntakeCaseSchema.safeParse(body)
  if (!parsed.success) return badRequest(parsed.error.issues.map(e => e.message).join(', '))

  const { createServiceClient } = await import('@/lib/supabase/server')
  const db = createServiceClient()
  const dba = db as any // eslint-disable-line @typescript-eslint/no-explicit-any

  // Verify municipality is active
  const { data: muni } = await db.from('municipalities').select('id, name').eq('id', parsed.data.municipality_id).eq('status', 'ACTIVE').single()
  if (!muni) return badRequest('Municipality not found or inactive')

  // Create the case
  const { data: newCase, error: caseError } = await dba.from('cases').insert({
    municipality_id: parsed.data.municipality_id,
    status: 'OPEN',
    citizen_initials: parsed.data.citizen_initials,
    citizen_age_range: parsed.data.citizen_age_range,
    citizen_gender: parsed.data.citizen_gender || null,
    citizen_notes: parsed.data.citizen_notes || null,
    weekly_hours: parsed.data.weekly_hours,
    complexity_level: parsed.data.complexity_level || 'MEDIUM',
    intake_contact_name: parsed.data.contact_name,
    intake_contact_email: parsed.data.contact_email,
  }).select('id, intake_token').single()

  if (caseError || !newCase) return serverError(caseError?.message)

  const caseId = newCase.id as string
  const intakeToken = newCase.intake_token as string

  // Insert lookup relations if provided
  const inserts: Promise<unknown>[] = []
  if (parsed.data.problem_area_ids?.length) {
    inserts.push(dba.from('case_problem_areas').insert(
      parsed.data.problem_area_ids.map((id: string) => ({ case_id: caseId, problem_area_id: id }))
    ))
  }
  if (parsed.data.goal_ids?.length) {
    inserts.push(dba.from('case_goals').insert(
      parsed.data.goal_ids.map((id: string) => ({ case_id: caseId, goal_id: id }))
    ))
  }
  if (parsed.data.special_wish_ids?.length) {
    inserts.push(dba.from('case_special_wishes').insert(
      parsed.data.special_wish_ids.map((id: string) => ({ case_id: caseId, special_wish_id: id }))
    ))
  }
  if (inserts.length) await Promise.all(inserts)

  // Auto-trigger matching (system-triggered, triggeredBy = null)
  let candidateCount = 0
  try {
    const result = await runMatchForCase(db, caseId, null)
    if (result.status === 'SCORED') candidateCount = result.candidateCount
  } catch {
    // Matching failure is non-fatal: admin will be notified and can re-run
  }

  // Notify admin
  const { subject, body: emailBody } = adminEmailBody('CASE_CREATED', caseId)
  await sendNotification({
    db,
    notification_type: 'CASE_CREATED',
    related_entity_type: 'cases',
    related_entity_id: caseId,
    subject,
    body: emailBody,
  })

  await logAuditEvent(db, {
    event_type: 'INTAKE_CASE_CREATED',
    actor_id: null,
    resource_type: 'cases',
    resource_id: caseId,
    metadata: {
      municipality_id: parsed.data.municipality_id,
      intake_contact_email: parsed.data.contact_email,
      candidates_found: candidateCount,
    },
  })

  return ok({ intake_token: intakeToken, case_id: caseId, candidates_found: candidateCount }, 201)
}
