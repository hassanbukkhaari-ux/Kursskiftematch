import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// GET /api/status-report-requests — professional gets their own pending requests
export async function GET() {
  const db = await createClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const svc = createServiceClient() as any
  const { data, error } = await svc
    .from('status_report_requests')
    .select(`
      id, case_id, report_type, deadline, promised_date, status, message, created_at,
      cases!inner(citizen_initials, citizen_age_range),
      status_reports(id, submitted_at)
    `)
    .eq('professional_id', user.id)
    .order('deadline', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data ?? [] })
}
