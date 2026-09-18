import { NextRequest } from 'next/server'
import { withAdminAuth, ok, notFound, serverError } from '@/lib/api-response'
import { createServiceClient } from '@/lib/supabase/server'
import { logAuditEvent } from '@/lib/audit'

// DELETE /api/admin/cases/[id]/delete-permanently — irreversible. For a case
// created by mistake (wrong municipality, duplicate, test entry) — never for
// a case with real citizen/municipality data that has actually been worked.
//
// Most case-scoped tables reference cases(id) WITHOUT ON DELETE CASCADE
// (case_assignments, case_grants, case_handovers, session_logs,
// registered_hours, contact_logs, contact_disclosures, match_runs,
// case_proposals), so they're deleted explicitly here, deepest children
// first. The rest (case_complexity_factors, case_problem_areas, case_goals,
// case_special_wishes, planned_hours, case_documents, status_report_requests
// -> status_reports) do cascade and are left to the final `cases` delete.
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return withAdminAuth(request, async (adminId) => {
    try {
      const svc = createServiceClient() as any

      const { data: caseRow, error: caseError } = await svc
        .from('cases')
        .select('id, case_number, citizen_initials, municipality_id')
        .eq('id', id)
        .maybeSingle()
      if (caseError) {
        console.error('[cases delete-permanently] Failed to load case', id, caseError)
        return serverError(caseError.message || 'Kunne ikke hente sagen')
      }
      if (!caseRow) return notFound('Sag')

      // case_documents rows cascade on the cases delete below, but the
      // uploaded files in storage do not — remove those first.
      const { data: docs, error: docsError } = await svc
        .from('case_documents')
        .select('storage_path')
        .eq('case_id', id)
      if (docsError) {
        console.error('[cases delete-permanently] Failed to list documents for', id, docsError)
        return serverError(docsError.message || 'Kunne ikke hente sagens dokumenter')
      }
      const paths: string[] = (docs ?? []).map((d: { storage_path: string | null }) => d.storage_path).filter(Boolean)
      if (paths.length) {
        const { error: storageError } = await svc.storage.from('case-documents').remove(paths)
        if (storageError) {
          console.error('[cases delete-permanently] Failed to remove storage files for', id, storageError)
          return serverError(storageError.message || 'Kunne ikke slette sagens dokumenter fra storage')
        }
      }

      // match_candidates reference match_run_id, not case_id — clear via the
      // case's match runs before the runs themselves can be deleted.
      const { data: runs, error: runsError } = await svc.from('match_runs').select('id').eq('case_id', id)
      if (runsError) {
        console.error('[cases delete-permanently] Failed to list match_runs for', id, runsError)
        return serverError(runsError.message || 'Kunne ikke hente sagens match-kørsler')
      }
      const runIds: string[] = (runs ?? []).map((r: { id: string }) => r.id)
      if (runIds.length) {
        const { error } = await svc.from('match_candidates').delete().in('match_run_id', runIds)
        if (error) {
          console.error('[cases delete-permanently] Failed to clear match_candidates for', id, error)
          return serverError(error.message || 'Kunne ikke rydde match-data')
        }
      }
      {
        const { error } = await svc.from('match_runs').delete().eq('case_id', id)
        if (error) {
          console.error('[cases delete-permanently] Failed to delete match_runs for', id, error)
          return serverError(error.message || 'Kunne ikke slette match-kørsler')
        }
      }

      // session_log_transfers reference session_log_id, not case_id — clear
      // via the case's session logs before the logs themselves can be
      // deleted. session_log_corrections cascade automatically.
      const { data: logs, error: logsError } = await svc.from('session_logs').select('id').eq('case_id', id)
      if (logsError) {
        console.error('[cases delete-permanently] Failed to list session_logs for', id, logsError)
        return serverError(logsError.message || 'Kunne ikke hente sagens sessionslog')
      }
      const logIds: string[] = (logs ?? []).map((l: { id: string }) => l.id)
      if (logIds.length) {
        const { error } = await svc.from('session_log_transfers').delete().in('session_log_id', logIds)
        if (error) {
          console.error('[cases delete-permanently] Failed to clear session_log_transfers for', id, error)
          return serverError(error.message || 'Kunne ikke rydde overdragede sessionslog')
        }
      }
      {
        const { error } = await svc.from('session_logs').delete().eq('case_id', id)
        if (error) {
          console.error('[cases delete-permanently] Failed to delete session_logs for', id, error)
          return serverError(error.message || 'Kunne ikke slette sessionslog')
        }
      }

      const directTables = [
        'registered_hours',
        'contact_logs',
        'contact_disclosures',
        'case_handovers',
        'case_proposals',
        'case_assignments',
        'case_grants',
      ]
      for (const table of directTables) {
        const { error } = await svc.from(table).delete().eq('case_id', id)
        if (error) {
          console.error(`[cases delete-permanently] Failed to delete ${table} for`, id, error)
          return serverError(error.message || `Kunne ikke slette ${table}`)
        }
      }

      const { error: deleteError } = await svc.from('cases').delete().eq('id', id)
      if (deleteError) {
        console.error('[cases delete-permanently] Failed to delete case', id, deleteError)
        return serverError(deleteError.message || 'Kunne ikke slette sagen')
      }

      await logAuditEvent(svc, {
        event_type: 'CASE_DELETED_PERMANENTLY',
        actor_id: adminId,
        resource_type: 'cases',
        resource_id: id,
        metadata: {
          case_number: caseRow.case_number,
          citizen_initials: caseRow.citizen_initials,
          municipality_id: caseRow.municipality_id,
        },
      })

      return ok({ ok: true })
    } catch (err) {
      console.error('[cases delete-permanently] Unexpected error for', id, err)
      const message = err instanceof Error ? err.message : 'Uventet fejl — prøv igen eller kontakt support'
      return serverError(message)
    }
  })
}
