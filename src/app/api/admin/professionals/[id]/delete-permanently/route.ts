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
    const svc = createServiceClient() as any

    const { data: pro, error: proError } = await svc
      .from('professionals')
      .select('id, profiles(email, full_name)')
      .eq('id', id)
      .maybeSingle()

    if (proError) return serverError(proError.message)
    if (!pro) return notFound('Kontaktperson')

    const checks = await Promise.all(
      HISTORY_CHECKS.map(({ table, column }) =>
        svc.from(table).select('id').eq(column, id).limit(1)
      )
    )
    const hasHistory = checks.some(({ data }: { data: unknown[] | null }) => (data?.length ?? 0) > 0)
    if (hasHistory) {
      return badRequest(
        'Denne kontaktperson har sagshistorik (tildeling, sessionslog, timer, statusrapport eller lignende) og kan ikke slettes permanent — brug "Arkiver kontaktperson" i stedet, så historikken bevares.'
      )
    }

    // Scoring artifacts from matching runs aren't real case history (every
    // candidate scored in a run gets a row, chosen or not) — clear them so
    // they don't block the cascade below, rather than treating them as a
    // reason to keep the person around.
    await svc.from('match_candidates').delete().eq('professional_id', id)

    // professional_documents rows cascade on professionals delete, but the
    // uploaded files in storage do not — remove those first.
    const { data: docs } = await svc
      .from('professional_documents')
      .select('file_path')
      .eq('professional_id', id)
    const paths: string[] = (docs ?? []).map((d: { file_path: string | null }) => d.file_path).filter(Boolean)
    if (paths.length) {
      const { error: storageError } = await svc.storage.from('professional-documents').remove(paths)
      if (storageError) return serverError(`Kunne ikke slette dokumenter fra storage: ${storageError.message}`)
    }

    const email = pro.profiles?.email ?? null
    const fullName = pro.profiles?.full_name ?? null

    await logAuditEvent(svc, {
      event_type: 'PROFESSIONAL_DELETED_PERMANENTLY',
      actor_id: adminId,
      resource_type: 'professionals',
      resource_id: id,
      metadata: { email, full_name: fullName },
    })

    // Deletes auth.users, which cascades profiles -> professionals and all
    // ON DELETE CASCADE profile-data tables (documents, competencies,
    // availability periods, capacity, planned hours) in one step.
    const { error: deleteError } = await svc.auth.admin.deleteUser(id)
    if (deleteError) return serverError(deleteError.message)

    return ok({ ok: true })
  })
}
