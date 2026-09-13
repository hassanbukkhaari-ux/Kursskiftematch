import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendNotification } from '@/lib/notifications/service'
import { logAuditEvent } from '@/lib/audit'

// POST /api/admin/status-report-requests/[id]/share — admin explicitly
// forwards a submitted status report to the municipality's sagsbehandler,
// via the same token-link pattern as case proposals. Deliberately a
// separate, explicit step from submission (CLAUDE.md: municipality reaches
// this "through the token-based proposal/message channel") — the report's
// free-text fields are the professional's own prose and could in principle
// name the citizen, which nothing here can safely auto-redact, so admin
// reviews before sending rather than it going out automatically.
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const db = await createClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const svc = createServiceClient() as any

  const { data: reqRow, error: reqError } = await svc
    .from('status_report_requests')
    .select('id, case_id, cases(municipality_id, intake_contact_email, case_number, citizen_initials, citizen_age_range)')
    .eq('id', id)
    .single()

  if (reqError || !reqRow) return NextResponse.json({ error: 'Ikke fundet' }, { status: 404 })

  const { data: report, error: reportError } = await svc
    .from('status_reports')
    .select('id, response_token, shared_with_municipality_at')
    .eq('request_id', id)
    .single()

  if (reportError || !report) {
    return NextResponse.json({ error: 'Ingen indsendt rapport at sende endnu' }, { status: 400 })
  }

  const { data: muni } = await svc
    .from('municipalities')
    .select('sagsbehandler_email')
    .eq('id', reqRow.cases?.municipality_id)
    .single()

  const sagsbehandlerEmail = reqRow.cases?.intake_contact_email || muni?.sagsbehandler_email
  if (!sagsbehandlerEmail) {
    return NextResponse.json({ error: 'Ingen sagsbehandler-mail fundet for denne sag' }, { status: 400 })
  }

  const now = new Date().toISOString()
  const { error: updateError } = await svc
    .from('status_reports')
    .update({ shared_with_municipality_at: now, shared_by: user.id })
    .eq('id', report.id)

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://kursskifte.dk'
  await sendNotification({
    db: svc,
    notification_type: 'STATUS_REPORT_SHARED',
    related_entity_type: 'status_reports',
    related_entity_id: report.id,
    recipient_email: sagsbehandlerEmail,
    subject: `Kursskifte: Statusrapport — sag ${reqRow.cases?.case_number ?? ''}`,
    body: [
      `Kursskifte har en statusrapport klar for borger ${reqRow.cases?.citizen_initials ?? ''} (${reqRow.cases?.citizen_age_range ?? ''}).`,
      '',
      `Se rapporten her:`,
      `${base}/municipality/status-reports/${report.response_token}`,
    ].join('\n'),
  })

  await logAuditEvent(svc, {
    event_type: 'STATUS_REPORT_SHARED',
    actor_id: user.id,
    resource_type: 'status_reports',
    resource_id: report.id,
    metadata: { request_id: id, case_id: reqRow.case_id },
  })

  return NextResponse.json({ ok: true, shared_with_municipality_at: now })
}
