import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { sendNotification } from '@/lib/notifications/service'
import { REPORT_TYPE_LABEL as REPORT_LABEL } from '@/lib/labels'

// POST /api/admin/status-report-requests/[id]/remind — send manual reminder
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const db = await createClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json().catch(() => ({}))
  const customMessage: string | undefined = body.message

  const svc = createServiceClient() as any
  const { data, error } = await svc
    .from('status_report_requests')
    .select(`
      id, report_type, deadline, status,
      cases!inner(citizen_initials),
      professionals!inner(id, profiles!inner(full_name, email))
    `)
    .eq('id', id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Ikke fundet' }, { status: 404 })
  if (data.status === 'SUBMITTED' || data.status === 'REVIEWED') {
    return NextResponse.json({ error: 'Rapporten er allerede indsendt' }, { status: 400 })
  }

  const email = data.professionals?.profiles?.email
  if (!email) return NextResponse.json({ error: 'Kontaktpersonen har ingen email' }, { status: 400 })

  const typeLabel = REPORT_LABEL[data.report_type] ?? 'Statusrapport'
  const deadlineFormatted = new Date(data.deadline).toLocaleDateString('da-DK', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
  const name = data.professionals?.profiles?.full_name ?? ''
  const initials = data.cases?.citizen_initials ?? ''
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kursskifte.dk'

  const lines = [
    `Hej ${name},`,
    '',
    `Vi vil gerne rykke dig for ${typeLabel.toLowerCase()} for borger ${initials}.`,
    `Fristen er ${deadlineFormatted}.`,
  ]
  if (customMessage) {
    lines.push('', customMessage)
  }
  lines.push(
    '',
    `Udfyld rapporten her: ${siteUrl}/dashboard/status-reports/${id}`,
    '',
    'Venlig hilsen',
    'Kursskifte',
  )

  await sendNotification({
    db: svc,
    notification_type: 'STATUS_REPORT_REMINDER',
    related_entity_type: 'status_report_request',
    related_entity_id: id,
    recipient_profile_id: data.professionals?.id,
    recipient_email: email,
    subject: `Rykker: ${typeLabel} for borger ${initials} — frist ${deadlineFormatted}`,
    body: lines.join('\n'),
  })

  return NextResponse.json({ ok: true })
}
