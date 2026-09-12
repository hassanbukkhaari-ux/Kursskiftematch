import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireCronSecret } from '@/lib/cron-auth'
import { sendNotification } from '@/lib/notifications/service'

// GET /api/cron/auto-status-reports — runs daily at 07:00 UTC
//
// Strategy (digitalization engineer approach):
//   FINAL  — grant ending in 25–35 days (5-day window; self-healing if cron misses a day)
//   MONTHLY — floor(days_since_start / 30) reports should exist; creates the delta
//             Stops when ≤ 30 days left (FINAL takes over)
//   Duplicate guard: skip if a non-REVIEWED request of the same type already exists
export async function GET(request: NextRequest) {
  const denied = requireCronSecret(request)
  if (denied) return denied

  const svc = createServiceClient() as any

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const fmt = (d: Date) => d.toISOString().slice(0, 10)
  const daysBetween = (a: Date, b: Date) =>
    Math.floor((b.getTime() - a.getTime()) / 86_400_000)

  // Admin profile for requested_by on auto-generated requests
  const { data: adminProfile } = await svc
    .from('profiles')
    .select('id')
    .eq('role', 'admin')
    .limit(1)
    .single()

  if (!adminProfile) {
    return NextResponse.json({ error: 'No admin profile found' }, { status: 500 })
  }

  // All active grants
  const { data: grants } = await svc
    .from('case_grants')
    .select('id, case_id, period_start, period_end')
    .eq('status', 'ACTIVE')

  if (!grants?.length) return NextResponse.json({ created: 0 })

  let created = 0

  for (const grant of grants) {
    const periodStart = new Date(grant.period_start)
    const periodEnd = new Date(grant.period_end)
    const daysUntilEnd = daysBetween(today, periodEnd)
    const daysSinceStart = daysBetween(periodStart, today)
    const grantDuration = daysBetween(periodStart, periodEnd)

    // Resolve current professional for this case
    const { data: caseView } = await svc
      .from('v_cases_with_professional')
      .select('id, citizen_initials, professional_id')
      .eq('id', grant.case_id)
      .single()

    if (!caseView?.professional_id) continue

    // ── FINAL: window 25–35 days before end ─────────────────────────────
    if (daysUntilEnd >= 25 && daysUntilEnd <= 35) {
      const { data: existing } = await svc
        .from('status_report_requests')
        .select('id')
        .eq('case_id', grant.case_id)
        .eq('report_type', 'FINAL')
        .neq('status', 'REVIEWED')
        .limit(1)

      if (!existing?.length) {
        const deadline = new Date(periodEnd)
        deadline.setDate(periodEnd.getDate() - 7)

        const grantEndFormatted = periodEnd.toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' })

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

        if (req) {
          await notifyProfessional(svc, {
            professionalId: caseView.professional_id,
            requestId: req.id,
            citizenInitials: caseView.citizen_initials,
            reportTypeLabel: 'afsluttende statusrapport',
            deadlineDate: deadline,
            extraContext: `Bevillingen udløber ${grantEndFormatted}.`,
          })
          created++
        }
      }
    }

    // ── MONTHLY: one per 30-day interval, while > 30 days remain ────────
    if (grantDuration > 60 && daysUntilEnd > 30 && daysSinceStart > 0) {
      const intervalsNeeded = Math.floor(daysSinceStart / 30)
      if (intervalsNeeded < 1) continue

      const { count: existingCount } = await svc
        .from('status_report_requests')
        .select('id', { count: 'exact', head: true })
        .eq('case_id', grant.case_id)
        .eq('report_type', 'MONTHLY')

      const toCreate = intervalsNeeded - (existingCount ?? 0)
      if (toCreate <= 0) continue

      // Create each missing monthly report (catch-up if cron missed days)
      for (let i = 0; i < toCreate; i++) {
        const deadline = new Date(today)
        deadline.setDate(today.getDate() + 7)

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

        if (req) {
          await notifyProfessional(svc, {
            professionalId: caseView.professional_id,
            requestId: req.id,
            citizenInitials: caseView.citizen_initials,
            reportTypeLabel: 'månedlig statusrapport',
            deadlineDate: deadline,
          })
          created++
        }
      }
    }
  }

  return NextResponse.json({ created })
}

// ── Shared email helper ───────────────────────────────────────────────────────

async function notifyProfessional(
  svc: any,
  opts: {
    professionalId: string
    requestId: string
    citizenInitials: string
    reportTypeLabel: string
    deadlineDate: Date
    extraContext?: string
  },
) {
  const { data: pro } = await svc
    .from('professionals')
    .select('profiles!inner(full_name, email)')
    .eq('id', opts.professionalId)
    .single()

  if (!pro?.profiles?.email) return

  const deadlineFormatted = opts.deadlineDate.toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' })

  await sendNotification({
    db: svc,
    notification_type: 'STATUS_REPORT_REQUESTED',
    related_entity_type: 'status_report_request',
    related_entity_id: opts.requestId,
    recipient_profile_id: opts.professionalId,
    recipient_email: pro.profiles.email,
    subject: `Kursskifte: ${opts.reportTypeLabel.charAt(0).toUpperCase() + opts.reportTypeLabel.slice(1)} for borger ${opts.citizenInitials}`,
    body: [
      `Hej ${pro.profiles.full_name ?? ''},`,
      '',
      opts.extraContext ?? '',
      opts.extraContext ? '' : null,
      `Kursskifte beder dig om at udfylde en ${opts.reportTypeLabel} for borger ${opts.citizenInitials}.`,
      '',
      `Frist: ${deadlineFormatted}`,
      '',
      `Udfyld rapporten her: ${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kursskifte.dk'}/dashboard/status-reports/${opts.requestId}`,
      '',
      'Venlig hilsen',
      'Kursskifte',
    ].filter(l => l !== null).join('\n'),
  })
}
