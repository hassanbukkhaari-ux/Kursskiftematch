import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireCronSecret } from '@/lib/cron-auth'
import { sendNotification } from '@/lib/notifications/service'
import { REPORT_TYPE_LABEL as REPORT_LABEL } from '@/lib/labels'

// GET /api/cron/status-report-reminders — send 14-day and 7-day reminders
export async function GET(request: NextRequest) {
  const denied = requireCronSecret(request)
  if (denied) return denied

  const svc = createServiceClient() as any

  const today = new Date()
  const in7 = new Date(today); in7.setDate(today.getDate() + 7)
  const in14 = new Date(today); in14.setDate(today.getDate() + 14)

  const fmt = (d: Date) => d.toISOString().slice(0, 10)

  // Find requests due in exactly 7 or 14 days that are not yet submitted
  const { data: requests } = await svc
    .from('status_report_requests')
    .select(`
      id, report_type, deadline, case_id,
      cases!inner(citizen_initials),
      professionals!inner(profiles!inner(full_name, email))
    `)
    .in('deadline', [fmt(in7), fmt(in14)])
    .in('status', ['PENDING', 'ACKNOWLEDGED'])

  if (!requests?.length) return NextResponse.json({ reminded: 0 })

  let reminded = 0
  for (const r of requests) {
    const email = r.professionals?.profiles?.email
    if (!email) continue

    const daysLeft = r.deadline === fmt(in7) ? 7 : 14
    const deadlineFormatted = new Date(r.deadline).toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' })
    const typeLabel = REPORT_LABEL[r.report_type] ?? 'Statusrapport'

    await sendNotification({
      db: svc,
      notification_type: 'STATUS_REPORT_REMINDER',
      related_entity_type: 'status_report_request',
      related_entity_id: r.id,
      recipient_profile_id: r.professionals?.id,
      recipient_email: email,
      subject: `Påmindelse: ${typeLabel} for borger ${r.cases?.citizen_initials ?? ''} — frist om ${daysLeft} dage`,
      body: [
        `Hej ${r.professionals?.profiles?.full_name ?? ''},`,
        '',
        `Dette er en påmindelse om at du har en ${typeLabel.toLowerCase()} for borger ${r.cases?.citizen_initials ?? ''} der skal afleveres senest ${deadlineFormatted}.`,
        '',
        `Du har ${daysLeft} dage tilbage.`,
        '',
        `Udfyld rapporten her: ${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kursskifte.dk'}/dashboard/status-reports/${r.id}`,
        '',
        'Venlig hilsen',
        'Kursskifte',
      ].join('\n'),
    })
    reminded++
  }

  return NextResponse.json({ reminded })
}
