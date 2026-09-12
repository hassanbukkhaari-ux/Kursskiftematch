import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendNotification } from '@/lib/notifications/service'
import { REPORT_TYPE_LABEL as REPORT_LABEL } from '@/lib/labels'

// POST /api/status-report-requests/[id]/submit — professional submits the filled report
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const db = await createClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const svc = createServiceClient() as any

  const { data: req } = await svc
    .from('status_report_requests')
    .select('professional_id, case_id, report_type, status')
    .eq('id', id)
    .single()

  if (!req) return NextResponse.json({ error: 'Ikke fundet' }, { status: 404 })
  if (req.professional_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (req.status === 'SUBMITTED' || req.status === 'REVIEWED') {
    return NextResponse.json({ error: 'Rapporten er allerede indsendt' }, { status: 400 })
  }

  const body = await request.json()
  const {
    period_start, period_end,
    everyday_situation, work_focus, progress_resources,
    challenges, concern_level, concern_text,
    collaboration, recommendation, overall_assessment,
    overall_assessment_note,
  } = body

  if (!period_start || !period_end || !overall_assessment) {
    return NextResponse.json({ error: 'Udfyld alle påkrævede felter' }, { status: 400 })
  }

  const now = new Date().toISOString()

  // Upsert the report (allow saving as draft before submitting)
  const { data: existing } = await svc
    .from('status_reports')
    .select('id')
    .eq('request_id', id)
    .maybeSingle()

  if (existing) {
    await svc.from('status_reports').update({
      period_start, period_end,
      everyday_situation, work_focus, progress_resources,
      challenges, concern_level, concern_text,
      collaboration, recommendation, overall_assessment,
      overall_assessment_note: overall_assessment_note ?? null,
      submitted_at: now,
      updated_at: now,
    }).eq('id', existing.id)
  } else {
    await svc.from('status_reports').insert({
      request_id: id,
      professional_id: user.id,
      case_id: req.case_id,
      period_start, period_end,
      everyday_situation, work_focus, progress_resources,
      challenges, concern_level, concern_text,
      collaboration, recommendation, overall_assessment,
      overall_assessment_note: overall_assessment_note ?? null,
      submitted_at: now,
    })
  }

  await svc.from('status_report_requests').update({
    status: 'SUBMITTED',
    updated_at: now,
  }).eq('id', id)

  // Notify admin
  const adminEmail = process.env.SYSTEM_ADMIN_EMAIL
  if (adminEmail) {
    const { data: pro } = await svc
      .from('professionals')
      .select('profiles!inner(full_name)')
      .eq('id', user.id)
      .single()

    const { data: caseData } = await svc
      .from('cases')
      .select('citizen_initials')
      .eq('id', req.case_id)
      .single()

    await sendNotification({
      db: svc,
      notification_type: 'STATUS_REPORT_SUBMITTED',
      related_entity_type: 'status_report_request',
      related_entity_id: id,
      recipient_email: adminEmail,
      subject: `Kursskifte: ${REPORT_LABEL[req.report_type] ?? 'Statusrapport'} indsendt — borger ${caseData?.citizen_initials ?? ''}`,
      body: [
        `${pro?.profiles?.full_name ?? 'En kontaktperson'} har indsendt en ${(REPORT_LABEL[req.report_type] ?? 'statusrapport').toLowerCase()} for borger ${caseData?.citizen_initials ?? ''}.`,
        '',
        `Se rapporten her: ${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kursskifte.dk'}/admin/status-reports/${id}`,
      ].join('\n'),
    })
  }

  return NextResponse.json({ ok: true })
}
