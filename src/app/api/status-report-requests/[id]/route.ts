import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

// GET /api/status-report-requests/[id] — professional gets their request
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const db = await createClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const svc = createServiceClient() as any
  const { data, error } = await svc
    .from('status_report_requests')
    .select(`
      id, case_id, professional_id, report_type, deadline, promised_date, status, message, created_at,
      cases!inner(citizen_initials, citizen_age_range),
      status_reports(*)
    `)
    .eq('id', id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single()
  const isAdmin = profile?.role === 'admin'
  const isPro = data.professional_id === user.id

  if (!isAdmin && !isPro) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return NextResponse.json({ data })
}

// PATCH /api/status-report-requests/[id] — professional acknowledges + sets promised_date
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const db = await createClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const { promised_date } = body

  const svc = createServiceClient() as any

  // Verify ownership
  const { data: req } = await svc
    .from('status_report_requests')
    .select('professional_id, status')
    .eq('id', id)
    .single()

  if (!req) return NextResponse.json({ error: 'Ikke fundet' }, { status: 404 })
  if (req.professional_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (req.status === 'SUBMITTED' || req.status === 'REVIEWED') {
    return NextResponse.json({ error: 'Rapporten er allerede indsendt' }, { status: 400 })
  }

  const { error } = await svc
    .from('status_report_requests')
    .update({
      status: 'ACKNOWLEDGED',
      promised_date: promised_date ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
