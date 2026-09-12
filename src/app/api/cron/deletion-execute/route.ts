import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { requireCronSecret } from '@/lib/cron-auth'
import { logAuditEvent } from '@/lib/audit'

// GET /api/cron/deletion-execute — called by Vercel Cron, executes pending deletions (WF-013)
export async function GET(request: NextRequest) {
  const denied = requireCronSecret(request)
  if (denied) return denied

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
  const errors: { id: string; reason: string }[] = []

  for (const schedule of pending || []) {
    try {
      if (schedule.record_type === 'cases') {
        await executeCaseDeletion(db, schedule.record_id)
      }

      await db
        .from('deletion_schedules')
        .update({ executed_at: now })
        .eq('id', schedule.id)

      await logAuditEvent(db, {
        event_type: 'RETENTION_DELETION_EXECUTED',
        actor_id: null,
        resource_type: schedule.record_type,
        resource_id: schedule.record_id,
        metadata: { schedule_id: schedule.id, reason: schedule.reason },
      })

      executed.push(schedule.record_id)
    } catch (err) {
      const reason = err instanceof Error ? err.message : String(err)
      console.error('[deletion-execute] Failed for', schedule.record_type, schedule.record_id, reason)
      errors.push({ id: schedule.record_id, reason })
    }
  }

  return NextResponse.json({
    processed: pending?.length || 0,
    executed: executed.length,
    errors: errors.length,
    executed_ids: executed,
    error_details: errors,
  })
}

async function executeCaseDeletion(
  db: ReturnType<typeof createServiceClient>,
  caseId: string
) {
  // 0. Storage objects — must go before the DB rows that reference them
  const { data: docs } = await (db as any)
    .from('case_documents')
    .select('storage_path')
    .eq('case_id', caseId)

  const paths: string[] = (docs ?? []).map((d: { storage_path: string }) => d.storage_path).filter(Boolean)
  if (paths.length) {
    const { error: storageError } = await db.storage.from('case-documents').remove(paths)
    if (storageError) throw new Error(`Storage removal failed: ${storageError.message}`)
  }
  await (db as any).from('case_documents').delete().eq('case_id', caseId)

  // Delete in FK-safe order per WF-013
  // 1. contact_disclosures
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
