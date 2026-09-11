import { NextRequest, NextResponse } from 'next/server'
import { sendNotification } from '@/lib/notifications/service'

const REPORT_TYPE_LABEL: Record<string, string> = {
  MONTHLY: 'Kort månedlig status',
  EXTENDED: 'Udvidet statusrapport',
  FINAL: 'Afsluttende statusrapport',
}

// GET /api/cron/auto-status-reports
// Runs daily. Auto-creates status report requests based on active grant periods:
//   FINAL  — when grant ends in 30 days (deadline = period_end - 7 days)
//   MONTHLY — when grant started 30 days ago and grant duration > 60 days
export async function GET(request: NextRequest) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Cron secret not configured' }, { status: 500 })
  }
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { createServiceClient } = await import('@/lib/supabase/server')
  const svc = createServiceClient() as any

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const fmt = (d: Date) => d.toISOString().slice(0, 10)

  // Dates we check against
  const in30 = new Date(today); in30.setDate(today.getDate() + 30)
  const ago30 = new Date(today); ago30.setDate(today.getDate() - 30)

  // Get the first admin profile to use as requested_by for auto-generated requests
  const { data: adminProfile } = await svc
    .from('profiles')
    .select('id')
    .eq('role', 'admin')
    .limit(1)
    .single()

  if (!adminProfile) {
    return NextResponse.json({ error: 'No admin profile found' }, { status: 500 })
  }

  // Fetch active grants with case + professional info
  const { data: grants } = await svc
    .from('case_grants')
    .select('id, case_id, period_start, period_end')
    .eq('status', 'ACTIVE')
    .in('period_end', [fmt(in30)])    // grants ending in exactly 30 days (FINAL trigger)
    // We'll also fetch grants that started 30 days ago in a second query below

  const { data: grantsMonthly } = await svc
    .from('case_grants')
    .select('id, case_id, period_start, period_end')
    .eq('status', 'ACTIVE')
    .eq('period_start', fmt(ago30))   // grants that started exactly 30 days ago (MONTHLY trigger)

  let created = 0

  // ── FINAL reports: grant ending in 30 days ──────────────────────────
  for (const grant of grants ?? []) {
    const { data: caseView } = await svc
      .from('v_cases_with_professional')
      .select('id, citizen_initials, professional_id')
      .eq('id', grant.case_id)
      .single()

    if (!caseView?.professional_id) continue

    // Avoid duplicates: skip if a FINAL report request already exists for this case
    const { data: existing } = await svc
      .from('status_report_requests')
      .select('id')
      .eq('case_id', grant.case_id)
      .eq('report_type', 'FINAL')
      .not('status', 'in', '("REVIEWED")')
      .limit(1)

    if (existing?.length) continue

    // Deadline = period_end - 7 days
    const deadline = new Date(grant.period_end)
    deadline.setDate(deadline.getDate() - 7)

    const grantEndFormatted = new Date(grant.period_end).toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' })

    const { data: req } = await svc
      .from('status_report_requests')
      .insert({
        case_id: grant.case_id,
        professional_id: caseView.professional_id,
        requested_by: adminProfile.id,
        report_type: 'FINAL',
        deadline: fmt(deadline),
        message: `Bevillingen for borger ${caseView.citizen_initials} udløber ${grantEndFormatted}. Udfyld venligst den afsluttende statusrapport inden fristen.`,
      })
      .select('id')
      .single()

    if (!req) continue

    // Notify professional
    const { data: pro } = await svc
      .from('professionals')
      .select('profiles!inner(full_name, email)')
      .eq('id', caseView.professional_id)
      .single()

    if (pro?.profiles?.email) {
      await sendNotification({
        db: svc,
        notification_type: 'STATUS_REPORT_REQUESTED',
        related_entity_type: 'status_report_request',
        related_entity_id: req.id,
        recipient_profile_id: caseView.professional_id,
        recipient_email: pro.profiles.email,
        subject: `Kursskifte: Afsluttende statusrapport for borger ${caseView.citizen_initials} — bevilling udløber snart`,
        body: [
          `Hej ${pro.profiles?.full_name ?? ''},`,
          '',
          `Bevillingen for borger ${caseView.citizen_initials} udløber ${grantEndFormatted}.`,
          '',
          `Kursskifte beder dig om at udfylde en afsluttende statusrapport senest ${new Date(deadline).toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' })}.`,
          '',
          `Udfyld rapporten her: ${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kursskifte.dk'}/dashboard/status-reports/${req.id}`,
          '',
          'Venlig hilsen',
          'Kursskifte',
        ].join('\n'),
      })
    }

    created++
  }

  // ── MONTHLY reports: grant started 30 days ago + duration > 60 days ──
  for (const grant of grantsMonthly ?? []) {
    const start = new Date(grant.period_start)
    const end = new Date(grant.period_end)
    const durationDays = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))

    // Only create monthly report if the grant is longer than 60 days
    if (durationDays <= 60) continue

    const { data: caseView } = await svc
      .from('v_cases_with_professional')
      .select('id, citizen_initials, professional_id')
      .eq('id', grant.case_id)
      .single()

    if (!caseView?.professional_id) continue

    // Avoid duplicates: skip if a MONTHLY report exists for this case in the last 35 days
    const since = new Date(today); since.setDate(today.getDate() - 35)
    const { data: existing } = await svc
      .from('status_report_requests')
      .select('id')
      .eq('case_id', grant.case_id)
      .eq('report_type', 'MONTHLY')
      .gte('created_at', since.toISOString())
      .limit(1)

    if (existing?.length) continue

    // Deadline = 7 days from now
    const deadline = new Date(today); deadline.setDate(today.getDate() + 7)

    const { data: req } = await svc
      .from('status_report_requests')
      .insert({
        case_id: grant.case_id,
        professional_id: caseView.professional_id,
        requested_by: adminProfile.id,
        report_type: 'MONTHLY',
        deadline: fmt(deadline),
        message: `Automatisk månedlig statusrapport for borger ${caseView.citizen_initials}.`,
      })
      .select('id')
      .single()

    if (!req) continue

    const { data: pro } = await svc
      .from('professionals')
      .select('profiles!inner(full_name, email)')
      .eq('id', caseView.professional_id)
      .single()

    if (pro?.profiles?.email) {
      await sendNotification({
        db: svc,
        notification_type: 'STATUS_REPORT_REQUESTED',
        related_entity_type: 'status_report_request',
        related_entity_id: req.id,
        recipient_profile_id: caseView.professional_id,
        recipient_email: pro.profiles.email,
        subject: `Kursskifte: Månedlig statusrapport for borger ${caseView.citizen_initials}`,
        body: [
          `Hej ${pro.profiles?.full_name ?? ''},`,
          '',
          `Det er tid til den månedlige statusrapport for borger ${caseView.citizen_initials}.`,
          '',
          `Frist: ${deadline.toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' })}`,
          '',
          `Udfyld rapporten her: ${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kursskifte.dk'}/dashboard/status-reports/${req.id}`,
          '',
          'Venlig hilsen',
          'Kursskifte',
        ].join('\n'),
      })
    }

    created++
  }

  return NextResponse.json({ created })
}
