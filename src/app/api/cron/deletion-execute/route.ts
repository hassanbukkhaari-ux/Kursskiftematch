import { NextRequest, NextResponse } from 'next/server'

// GET /api/cron/deletion-execute — called by Vercel Cron, executes pending deletions (WF-013)
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { createServiceClient } = await import('@/lib/supabase/server')
  const db = createServiceClient()
  const now = new Date().toISOString()

  // Find deletion schedules due for execution
  const { data: pending, error: pendingError } = await db
    .from('deletion_schedules')
    .select('*')
    .lte('scheduled_for_deletion_at', now)
    .is('executed_at', null)

  if (pendingError) {
    return NextResponse.json({ error: 'Failed to load deletion schedules' }, { status: 500 })
  }

  const executed: string[] = []
  const errors: string[] = []

  for (const schedule of pending || []) {
    try {
      if (schedule.record_type === 'cases') {
        await executeCaseDeletion(db, schedule.record_id)
      }

      await db
        .from('deletion_schedules')
        .update({ executed_at: now })
        .eq('id', schedule.id)

      executed.push(schedule.record_id)
    } catch {
      errors.push(schedule.record_id)
    }
  }

  return NextResponse.json({
    processed: pending?.length || 0,
    executed: executed.length,
    errors: errors.length,
    executed_ids: executed,
  })
}

async function executeCaseDeletion(
  db: Awaited<ReturnType<typeof import('@/lib/supabase/server').createServiceClient>>,
  caseId: string
) {
  // Delete in FK-safe order per WF-013
  // 1. contact_disclosures (by case_id), then contact_logs
  const { data: contactLogs } = await db
    .from('contact_logs')
    .select('id')
    .eq('case_id', caseId)

  await db.from('contact_disclosures').delete().eq('case_id', caseId)

  if (contactLogs?.length) {
    const logIds = contactLogs.map(l => l.id)
    await db.from('contact_logs').delete().in('id', logIds)
  }

  // 2. match_candidates via match_runs
  const { data: matchRuns } = await db
    .from('match_runs')
    .select('id')
    .eq('case_id', caseId)

  if (matchRuns?.length) {
    const runIds = matchRuns.map(r => r.id)
    await db.from('match_candidates').delete().in('match_run_id', runIds)
    await db.from('match_runs').delete().in('id', runIds)
  }

  // 3. session_log_corrections via session_logs
  const { data: sessionLogs } = await db
    .from('session_logs')
    .select('id')
    .eq('case_id', caseId)

  if (sessionLogs?.length) {
    const logIds = sessionLogs.map(l => l.id)
    await db.from('session_log_corrections').delete().in('session_log_id', logIds)
    await db.from('session_logs').delete().in('id', logIds)
  }

  // 4. Remaining case-linked tables (cascades handle children)
  await db.from('registered_hours').delete().eq('case_id', caseId)
  await db.from('contact_logs').delete().eq('case_id', caseId)
  await db.from('case_assignments').delete().eq('case_id', caseId)
  await db.from('case_grants').delete().eq('case_id', caseId)
  await db.from('case_handovers').delete().eq('case_id', caseId)
  await db.from('case_complexity_factors').delete().eq('case_id', caseId)

  // 5. Finally the case itself
  await db.from('cases').delete().eq('id', caseId)
}
