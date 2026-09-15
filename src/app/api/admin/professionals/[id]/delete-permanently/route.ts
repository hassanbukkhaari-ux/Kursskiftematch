import { NextRequest } from 'next/server'
import { withAdminAuth, ok, badRequest, notFound, serverError } from '@/lib/api-response'
import { createServiceClient } from '@/lib/supabase/server'
import { logAuditEvent } from '@/lib/audit'

// Tables that hold real case-related history for a professional and do NOT
// cascade on delete (by design — case history must survive a professional
// being removed). If any of these has a row, this professional has actually
// done real work and must be archived instead of permanently deleted.
const HISTORY_CHECKS: { table: string; column: string }[] = [
  { table: 'case_assignments', column: 'professional_id' },
  { table: 'case_handovers', column: 'outgoing_professional_id' },
  { table: 'case_handovers', column: 'incoming_professional_id' },
  { table: 'session_logs', column: 'professional_id' },
  { table: 'session_log_transfers', column: 'from_professional_id' },
  { table: 'session_log_transfers', column: 'to_professional_id' },
  { table: 'registered_hours', column: 'professional_id' },
  { table: 'contact_logs', column: 'professional_id' },
  { table: 'contact_disclosures', column: 'disclosed_to_professional_id' },
  { table: 'case_proposals', column: 'professional_id' },
  { table: 'status_report_requests', column: 'professional_id' },
  { table: 'status_reports', column: 'professional_id' },
]

// DELETE /api/admin/professionals/[id]/delete-permanently — irreversible.
// Unlike DELETE /api/admin/professionals/[id] (archives, keeps everything),
// this actually removes the person: for cleaning up test entries, duplicate
// signups, or invitations that never went anywhere ("Ukendt bruger — profil
// mangler" style rows) — never for someone who has done real case work.
// Blocked outright if any real case-history table references them.
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return withAdminAuth(request, async (adminId) => {
    try {
      const svc = createServiceClient() as any

      const { data: pro, error: proError } = await svc
        .from('professionals')
        .select('id, profiles!inner(email, full_name)')
        .eq('id', id)
        .maybeSingle()

      if (proError) {
        console.error('[delete-permanently] Failed to load professional', id, proError)
        return serverError(proError.message || 'Kunne ikke hente kontaktpersonen')
      }
      if (!pro) return notFound('Kontaktperson')

      const checkResults = await Promise.all(
        HISTORY_CHECKS.map(({ table, column }) =>
          svc.from(table).select('id').eq(column, id).limit(1)
        )
      )
      const queryError = checkResults.find((r: { error: unknown }) => r.error)?.error as { message?: string } | undefined
      if (queryError) {
        console.error('[delete-permanently] History check query failed for', id, queryError)
        return serverError(queryError.message || 'Kunne ikke tjekke sagshistorik')
      }
      const hasHistory = checkResults.some((r: { data: unknown[] | null }) => (r.data?.length ?? 0) > 0)
      if (hasHistory) {
        return badRequest(
          'Denne kontaktperson har sagshistorik (tildeling, sessionslog, timer, statusrapport eller lignende) og kan ikke slettes permanent — brug "Arkiver kontaktperson" i stedet, så historikken bevares.'
        )
      }

      // Scoring artifacts from matching runs aren't real case history (every
      // candidate scored in a run gets a row, chosen or not) — clear them so
      // they don't block the cascade below, rather than treating them as a
      // reason to keep the person around.
      const { error: matchCandError } = await svc.from('match_candidates').delete().eq('professional_id', id)
      if (matchCandError) {
        console.error('[delete-permanently] Failed to clear match_candidates for', id, matchCandError)
        return serverError(matchCandError.message || 'Kunne ikke rydde match-data')
      }

      // professional_documents rows cascade on professionals delete, but the
      // uploaded files in storage do not — remove those first.
      const { data: docs, error: docsError } = await svc
        .from('professional_documents')
        .select('file_path')
        .eq('professional_id', id)
      if (docsError) {
        console.error('[delete-permanently] Failed to list documents for', id, docsError)
        return serverError(docsError.message || 'Kunne ikke hente dokumenter')
      }
      const paths: string[] = (docs ?? []).map((d: { file_path: string | null }) => d.file_path).filter(Boolean)
      if (paths.length) {
        const { error: storageError } = await svc.storage.from('professional-documents').remove(paths)
        if (storageError) {
          console.error('[delete-permanently] Failed to remove storage files for', id, storageError)
          return serverError(storageError.message || 'Kunne ikke slette dokumenter fra storage')
        }
      }

      const email = pro.profiles?.email ?? null
      const fullName = pro.profiles?.full_name ?? null

      // Deletes auth.users, which cascades profiles -> professionals and all
      // ON DELETE CASCADE profile-data tables (documents, competencies,
      // availability periods, capacity, planned hours) in one step.
      const { error: deleteError } = await svc.auth.admin.deleteUser(id)
      if (deleteError) {
        console.error('[delete-permanently] auth.admin.deleteUser failed for', id, deleteError)
        return serverError(deleteError.message || 'Kunne ikke slette brugeren')
      }

      await logAuditEvent(svc, {
        event_type: 'PROFESSIONAL_DELETED_PERMANENTLY',
        actor_id: adminId,
        resource_type: 'professionals',
        resource_id: id,
        metadata: { email, full_name: fullName },
      })

      return ok({ ok: true })
    } catch (err) {
      console.error('[delete-permanently] Unexpected error for', id, err)
      const message = err instanceof Error ? err.message : 'Uventet fejl — prøv igen eller kontakt support'
      return serverError(message)
    }
  })
}
