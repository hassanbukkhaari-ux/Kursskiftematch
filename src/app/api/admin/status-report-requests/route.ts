import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendNotification } from '@/lib/notifications/service'

const REPORT_TYPE_LABEL: Record<string, string> = {
  MONTHLY: 'Kort månedlig status',
  EXTENDED: 'Udvidet statusrapport',
  FINAL: 'Afsluttende statusrapport',
}

// GET /api/admin/status-report-requests — admin overview of all requests
export async function GET() {
  const db = await createClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const svc = createServiceClient() as any
  const { data, error } = await svc
    .from('status_report_requests')
    .select(`
      id, case_id, report_type, deadline, promised_date, status, message, created_at,
      cases!inner(citizen_initials, citizen_age_range),
      professionals!inner(profiles!inner(full_name, email))
    `)
    .order('deadline', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data ?? [] })
}

// POST /api/admin/status-report-requests — admin creates a new request
export async function POST(request: NextRequest) {
  const db = await createClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await db.from('profiles').select('role, full_name').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { case_id, professional_id, report_type, deadline, message } = body

  if (!case_id || !professional_id || !report_type || !deadline) {
    return NextResponse.json({ error: 'Manglende felter' }, { status: 400 })
  }
  if (!['MONTHLY', 'EXTENDED', 'FINAL'].includes(report_type)) {
    return NextResponse.json({ error: 'Ugyldig rapport-type' }, { status: 400 })
  }

  const svc = createServiceClient() as any

  const { data: req, error } = await svc
    .from('status_report_requests')
    .insert({ case_id, professional_id, requested_by: user.id, report_type, deadline, message: message || null })
    .select('id')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Notify professional
  const { data: pro } = await svc
    .from('professionals')
    .select('profiles!inner(full_name, email)')
    .eq('id', professional_id)
    .single()

  const { data: caseData } = await svc
    .from('cases')
    .select('citizen_initials')
    .eq('id', case_id)
    .single()

  if (pro?.profiles?.email) {
    const typeLabel = REPORT_TYPE_LABEL[report_type] ?? report_type
    const deadlineFormatted = new Date(deadline).toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' })
    await sendNotification({
      db: svc,
      notification_type: 'STATUS_REPORT_REQUESTED',
      related_entity_type: 'status_report_request',
      related_entity_id: req.id,
      recipient_profile_id: professional_id,
      recipient_email: pro.profiles.email,
      subject: `Kursskifte: ${typeLabel} ønskes for borger ${caseData?.citizen_initials ?? ''}`,
      body: [
        `Hej ${pro.profiles.full_name ?? ''},`,
        '',
        `Kursskifte beder dig om at udfylde en ${typeLabel.toLowerCase()} for borger ${caseData?.citizen_initials ?? ''}.`,
        '',
        `Frist: ${deadlineFormatted}`,
        message ? `\nBesked fra Kursskifte:\n${message}` : '',
        '',
        'Log ind på dit dashboard for at udfylde rapporten:',
        `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kursskifte.dk'}/dashboard/status-reports/${req.id}`,
        '',
        'Venlig hilsen',
        'Kursskifte',
      ].join('\n'),
    })
  }

  return NextResponse.json({ id: req.id }, { status: 201 })
}
