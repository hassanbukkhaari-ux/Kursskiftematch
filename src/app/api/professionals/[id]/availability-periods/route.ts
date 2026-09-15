import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, created, badRequest, forbidden, notFound, serverError, withAuth } from '@/lib/api-response'
import { logAuditEvent } from '@/lib/audit'
import { sendNotification } from '@/lib/notifications/service'

const PERIOD_TYPE_LABEL: Record<string, string> = { VACATION: 'Ferie', PAUSE: 'Pause' }

const CreatePeriodSchema = z.object({
  period_type: z.enum(['VACATION', 'PAUSE']),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'start_date must be YYYY-MM-DD'),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'end_date must be YYYY-MM-DD').nullable().optional(),
  note: z.string().max(500).nullable().optional(),
})

// GET /api/professionals/[id]/availability-periods
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return withAuth(request, async (userId, role) => {
    if (role !== 'admin' && userId !== id) return forbidden()

    const { createClient } = await import('@/lib/supabase/server')
    const db = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dba = db as any

    const { data, error } = await dba
      .from('professional_availability_periods')
      .select('id, period_type, start_date, end_date, note, created_at')
      .eq('professional_id', id)
      .order('start_date', { ascending: true })

    if (error) return serverError(error.message)
    return ok(data ?? [])
  })
}

// POST /api/professionals/[id]/availability-periods
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return withAuth(request, async (userId, role) => {
    if (role !== 'admin' && userId !== id) return forbidden()

    let body: unknown
    try { body = await request.json() } catch { return badRequest('Invalid JSON') }

    const parsed = CreatePeriodSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.issues.map(e => e.message).join(', '))

    if (parsed.data.end_date && parsed.data.end_date < parsed.data.start_date) {
      return badRequest('end_date cannot be before start_date')
    }

    const { createClient } = await import('@/lib/supabase/server')
    const db = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dba = db as any

    // Verify professional exists
    const { data: pro } = await db.from('professionals').select('id').eq('id', id).single()
    if (!pro) return notFound('Professional')

    const { data, error } = await dba
      .from('professional_availability_periods')
      .insert({
        professional_id: id,
        period_type: parsed.data.period_type,
        start_date: parsed.data.start_date,
        end_date: parsed.data.end_date ?? null,
        note: parsed.data.note ?? null,
        created_by: userId,
      })
      .select('id, period_type, start_date, end_date, note, created_at')
      .single()

    if (error || !data) return serverError(error?.message)

    await logAuditEvent(db, {
      event_type: 'PROFESSIONAL_UPDATED',
      actor_id: userId,
      resource_type: 'professionals',
      resource_id: id,
      metadata: { action: 'availability_period_added', period_type: parsed.data.period_type, start_date: parsed.data.start_date },
    })

    // Admin has no other way to learn about this proactively — it only
    // stops new matching, it never touches an already-assigned case. Admin
    // needs to see it immediately to decide whether the citizen/kommunens
    // sagsbehandler should be informed, and whether an active case should
    // be handed over temporarily or simply continue with the same contact
    // person until they're back.
    const [{ data: proProfile }, { data: activeAssignments }] = await Promise.all([
      db.from('profiles').select('full_name').eq('id', id).single(),
      dba.from('case_assignments')
        .select('cases(case_number, citizen_initials)')
        .eq('professional_id', id)
        .is('ended_at', null),
    ])

    const periodLabel = PERIOD_TYPE_LABEL[parsed.data.period_type] ?? parsed.data.period_type
    const dateRange = parsed.data.end_date
      ? `${parsed.data.start_date} til ${parsed.data.end_date}`
      : `${parsed.data.start_date} og indtil videre`
    const caseLines = (activeAssignments ?? [])
      .map((a: any) => a.cases ? `- ${a.cases.case_number} (${a.cases.citizen_initials})` : null)
      .filter(Boolean)
    const caseSection = caseLines.length > 0
      ? `\n\nAktive sager der berøres:\n${caseLines.join('\n')}\n\nVurdér om borgeren/kommunens sagsbehandler skal informeres, og om sagen/sagerne skal overdrages midlertidigt eller fortsætte med samme kontaktperson.`
      : '\n\nIngen aktive sager tilknyttet lige nu.'

    await sendNotification({
      db,
      notification_type: 'PROFESSIONAL_AVAILABILITY_PERIOD_ADDED',
      related_entity_type: 'professionals',
      related_entity_id: id,
      recipient_email: process.env.SYSTEM_ADMIN_EMAIL,
      subject: `${periodLabel} meldt: ${proProfile?.full_name ?? 'En kontaktperson'} — Kursskifte`,
      body: `${proProfile?.full_name ?? 'En kontaktperson'} har meldt ${periodLabel.toLowerCase()} fra ${dateRange}.${caseSection}`,
    })

    return created(data)
  })
}
