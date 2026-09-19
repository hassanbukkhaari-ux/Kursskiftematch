import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireCronSecret } from '@/lib/cron-auth'
import { sendNotification } from '@/lib/notifications/service'

const REMINDER_AFTER_DAYS = 5

// GET /api/cron/startup-contact-reminders — den naturlige vej efter en sag
// går aktiv er at kontaktpersonen selv tager kontakt til kommunens
// sagsbehandler for at aftale et opstartsmøde/brief om borgeren. Er der
// gået REMINDER_AFTER_DAYS dage uden nogen logget kontakt (contact_logs)
// på sagen, sender vi en påmindelse.
export async function GET(request: NextRequest) {
  const denied = requireCronSecret(request)
  if (denied) return denied

  const svc = createServiceClient() as any

  const dayStart = (daysAgo: number) => {
    const d = new Date()
    d.setUTCHours(0, 0, 0, 0)
    d.setUTCDate(d.getUTCDate() - daysAgo)
    return d
  }
  // Assignments that started exactly REMINDER_AFTER_DAYS ago (one calendar
  // day window) — same fixed-offset pattern as status-report-reminders, so
  // this fires once per assignment rather than every day after the deadline.
  const windowStart = dayStart(REMINDER_AFTER_DAYS)
  const windowEnd = dayStart(REMINDER_AFTER_DAYS - 1)

  const { data: assignments } = await svc
    .from('case_assignments')
    .select('id, case_id, professional_id, started_at, cases(status, case_number, citizen_initials), professionals!inner(profiles!inner(full_name, email))')
    .is('ended_at', null)
    .gte('started_at', windowStart.toISOString())
    .lt('started_at', windowEnd.toISOString())

  const activeAssignments = (assignments ?? []).filter((a: any) => a.cases?.status === 'ACTIVE')
  if (!activeAssignments.length) return NextResponse.json({ reminded: 0 })

  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kursskifte.dk'
  let reminded = 0

  for (const a of activeAssignments) {
    const email = a.professionals?.profiles?.email
    if (!email) continue

    const { count } = await svc
      .from('contact_logs')
      .select('id', { count: 'exact', head: true })
      .eq('case_id', a.case_id)
      .eq('professional_id', a.professional_id)

    if (count && count > 0) continue

    await sendNotification({
      db: svc,
      notification_type: 'STARTUP_CONTACT_REMINDER',
      related_entity_type: 'case_assignments',
      related_entity_id: a.id,
      recipient_profile_id: a.professional_id,
      recipient_email: email,
      subject: `Påmindelse: kontakt sagsbehandler om opstartsmøde — sag ${a.cases?.case_number ?? ''}`,
      body: [
        `Hej ${a.professionals?.profiles?.full_name ?? ''},`,
        '',
        `Du blev tildelt sagen for borger ${a.cases?.citizen_initials ?? ''} for ${REMINDER_AFTER_DAYS} dage siden, og der er endnu ikke logget kontakt til kommunens sagsbehandler.`,
        '',
        'Har I allerede aftalt eller holdt et opstartsmøde, så log det på sagen. Har I ikke, så tag kontakt til sagsbehandleren nu for at aftale det.',
        '',
        `Se sagen: ${base}/dashboard/cases/${a.case_id}`,
      ].join('\n'),
    })
    reminded++
  }

  return NextResponse.json({ reminded })
}
