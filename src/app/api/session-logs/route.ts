import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, created, badRequest, forbidden, serverError, withAuth } from '@/lib/api-response'
import { logAuditEvent } from '@/lib/audit'
import { sendNotification } from '@/lib/notifications/service'

const CreateSessionLogSchema = z.object({
  case_id: z.string().uuid(),
  session_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'session_date must be YYYY-MM-DD'),
  duration_minutes: z.number().int().min(1),
  observations: z.string().optional(),
  citizen_mood_tone: z.string().optional(),
  follow_up_needed: z.boolean().default(false),
  follow_up_reason: z.string().optional(),
  participant_names: z.array(z.string()).optional(),
  location: z.string().optional(),
})

// GET /api/session-logs
export async function GET(request: NextRequest) {
  return withAuth(request, async (userId, role) => {
    const { createClient } = await import('@/lib/supabase/server')
    const db = await createClient()
    const { searchParams } = new URL(request.url)
    const case_id = searchParams.get('case_id')
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = db
      .from('session_logs')
      .select('*', { count: 'exact' })
      .order('session_date', { ascending: false })
      .range(offset, offset + limit - 1)

    if (role !== 'admin') {
      query = query.eq('professional_id', userId)
    }
    if (case_id) query = query.eq('case_id', case_id)
    if (status) query = query.eq('status', status as 'DRAFT' | 'FINAL' | 'CORRECTED')

    const { data, error, count } = await query
    if (error) return serverError()
    return ok({ data, count, limit, offset })
  })
}

// POST /api/session-logs — professional creates session log (WF-005)
export async function POST(request: NextRequest) {
  return withAuth(request, async (userId, role) => {
    let body: unknown
    try { body = await request.json() } catch { return badRequest('Invalid JSON') }

    const parsed = CreateSessionLogSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.issues.map(e => e.message).join(', '))

    const { createClient } = await import('@/lib/supabase/server')
    const db = await createClient()

    if (role !== 'admin') {
      const { data: assignment } = await db
        .from('case_assignments')
        .select('id')
        .eq('case_id', parsed.data.case_id)
        .eq('professional_id', userId)
        .is('ended_at', null)
        .single()

      if (!assignment) return forbidden()
    }

    const { data, error } = await db
      .from('session_logs')
      .insert({
        case_id: parsed.data.case_id,
        professional_id: userId,
        session_date: parsed.data.session_date,
        duration_minutes: parsed.data.duration_minutes,
        observations: parsed.data.observations || null,
        citizen_mood_tone: parsed.data.citizen_mood_tone || null,
        follow_up_needed: parsed.data.follow_up_needed,
        follow_up_reason: parsed.data.follow_up_reason || null,
        participant_names: parsed.data.participant_names || [],
        location: parsed.data.location || null,
        status: 'DRAFT',
        created_by: userId,
      })
      .select()
      .single()

    if (error) return serverError(error.message)

    await logAuditEvent(db, {
      event_type: 'SESSION_LOG_CREATED',
      actor_id: userId,
      resource_type: 'session_logs',
      resource_id: data.id,
      metadata: { case_id: parsed.data.case_id, session_date: parsed.data.session_date },
    })

    // Auto-register DIRECT_SESSION hours from session log duration
    const rawHours = parsed.data.duration_minutes / 60
    const roundedHours = Math.round(rawHours * 4) / 4 // nearest 0.25
    const clampedHours = Math.max(0.25, Math.min(8, roundedHours))
    await db.from('registered_hours' as any).insert({
      case_id: parsed.data.case_id,
      professional_id: userId,
      work_date: parsed.data.session_date,
      work_type: 'DIRECT_SESSION',
      hours: clampedHours,
      session_log_id: data.id,
      description: parsed.data.observations?.slice(0, 200) || 'Direkte session',
      status: 'PENDING',
      created_by: userId,
    })

    // Email professional when follow-up is needed
    if (parsed.data.follow_up_needed) {
      const { data: profile } = await db.from('profiles').select('email, full_name').eq('id', userId).single()
      if (profile?.email) {
        const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://kursskifte.dk'
        await sendNotification({
          db,
          notification_type: 'FOLLOW_UP_NEEDED',
          related_entity_type: 'session_logs',
          related_entity_id: data.id,
          recipient_profile_id: userId,
          recipient_email: profile.email,
          subject: 'Opfølgning påkrævet — Kursskifte',
          body: `Hej ${profile.full_name ?? ''},\n\nDu har markeret en sessionslog med behov for opfølgning.\n\n${parsed.data.follow_up_reason ? `Opfølgningsnote:\n${parsed.data.follow_up_reason}\n\n` : ''}Se dine sessionslogs her:\n${base}/dashboard/session-logs\n\nMed venlig hilsen\nKursskifte`,
        })
      }
    }

    return created(data)
  })
}
