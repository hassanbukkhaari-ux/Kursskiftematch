import { withAdminAuth } from '@/lib/api-response'
import { badRequest, ok, serverError } from '@/lib/api-response'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'

const REQUIRED_VERIFIED_DOCS: Record<string, string> = {
  CRIMINAL_RECORD: 'straffeattest',
  CHILD_PROTECTION: 'børneattest',
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return withAdminAuth(request, async () => {
    let body: Record<string, unknown>
    try { body = await request.json() } catch { return badRequest('Invalid JSON') }

    const status = body.status as string | undefined
    if (!status || !['ACTIVE', 'INACTIVE', 'SUSPENDED'].includes(status)) {
      return badRequest('status must be ACTIVE, INACTIVE, or SUSPENDED')
    }

    // Activation requires both background checks to already be verified —
    // Kursskifte's public commitment ("ingen fagperson aktiveres uden
    // forudgående godkendelse") was previously only a human process, with
    // nothing in code stopping an accidental early activation.
    if (status === 'ACTIVE') {
      const svc = createServiceClient()
      const { data: docs, error: docsError } = await (svc as any)
        .from('professional_documents')
        .select('document_type, status')
        .eq('professional_id', id)
        .in('document_type', Object.keys(REQUIRED_VERIFIED_DOCS))

      if (docsError) return serverError(docsError.message)

      const verified = new Set(
        (docs ?? []).filter((d: { status: string }) => d.status === 'VERIFIED').map((d: { document_type: string }) => d.document_type)
      )
      const missing = Object.keys(REQUIRED_VERIFIED_DOCS).filter(t => !verified.has(t))

      if (missing.length > 0) {
        const labels = missing.map(t => REQUIRED_VERIFIED_DOCS[t]).join(' og ')
        return badRequest(`Kan ikke aktivere: ${labels} er ikke verificeret endnu. Godkend dokumentet/dokumenterne på fagpersonens profil først.`)
      }

      // capacity_hours_week and availability_status both default to 0 /
      // UNAVAILABLE at registration and are only ever changed by an admin
      // editing the profile separately. v_professionals_available (the
      // matching pool) excludes anyone left at those defaults — so a
      // professional could be switched to ACTIVE and look completely normal
      // in the admin list while being permanently invisible to matching,
      // with nothing anywhere pointing at why. Block activation until both
      // are set to real values.
      const { data: proRow, error: proError } = await svc
        .from('professionals')
        .select('capacity_hours_week, availability_status')
        .eq('id', id)
        .single()

      if (proError || !proRow) return serverError(proError?.message)

      const capacityMissing = !proRow.capacity_hours_week || proRow.capacity_hours_week <= 0
      const availabilityMissing = proRow.availability_status === 'UNAVAILABLE'

      if (capacityMissing || availabilityMissing) {
        const parts: string[] = []
        if (capacityMissing) parts.push('ugentlig kapacitet (timer/uge)')
        if (availabilityMissing) parts.push('tilgængelighed (må ikke stå som "Utilgængelig")')
        return badRequest(`Kan ikke aktivere: ${parts.join(' og ')} er ikke sat endnu. Ret det på fagpersonens profil først, ellers kan personen aldrig matches til en sag.`)
      }
    }

    const db = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await db
      .from('professionals')
      .update({ status: status as any })
      .eq('id', id)

    if (error) return serverError(error.message)
    return ok({ ok: true, status })
  })
}
