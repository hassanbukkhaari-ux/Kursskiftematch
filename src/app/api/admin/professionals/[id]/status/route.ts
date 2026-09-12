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
