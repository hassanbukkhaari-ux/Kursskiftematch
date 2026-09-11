import { withAdminAuth, ok, serverError } from '@/lib/api-response'
import { createServiceClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    const svc = createServiceClient()
    const { searchParams } = new URL(request.url)
    const case_id = searchParams.get('case_id')

    let query = (svc as any)
      .from('session_logs')
      .select(`
        id, case_id, session_date, duration_minutes, observations,
        citizen_mood_tone, follow_up_needed, follow_up_reason,
        status, created_at,
        cases!inner(citizen_initials, citizen_age_range),
        professionals!inner(profiles!inner(full_name))
      `)
      .order('session_date', { ascending: false })
      .limit(200)

    if (case_id) query = query.eq('case_id', case_id)

    const { data, error } = await query
    if (error) return serverError(error.message)

    const rows = (data ?? []).map((r: any) => ({
      id: r.id,
      case_id: r.case_id,
      citizen_initials: r.cases?.citizen_initials ?? '??',
      citizen_age_range: r.cases?.citizen_age_range ?? '',
      professional_name: r.professionals?.profiles?.full_name ?? 'Ukendt',
      session_date: r.session_date,
      duration_minutes: r.duration_minutes,
      observations: r.observations,
      citizen_mood_tone: r.citizen_mood_tone,
      follow_up_needed: r.follow_up_needed,
      follow_up_reason: r.follow_up_reason,
      status: r.status,
      created_at: r.created_at,
    }))

    return ok({ data: rows })
  })
}
