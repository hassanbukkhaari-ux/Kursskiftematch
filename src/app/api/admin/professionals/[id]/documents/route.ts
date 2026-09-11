import { withAdminAuth, badRequest, ok, serverError } from '@/lib/api-response'
import { createServiceClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'

const MANAGED_TYPES = new Set(['CRIMINAL_RECORD', 'CHILD_PROTECTION'])

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: professionalId } = await params

  return withAdminAuth(request, async (adminId) => {
    let body: { document_type?: string; action?: string }
    try { body = await request.json() } catch { return badRequest('Invalid JSON') }

    const { document_type, action } = body
    if (!document_type || !MANAGED_TYPES.has(document_type)) {
      return badRequest('Kun CRIMINAL_RECORD og CHILD_PROTECTION kan godkendes her')
    }

    const svc = createServiceClient()
    const now = new Date().toISOString()

    if (action === 'APPROVE') {
      // Upsert: create or update the document record to APPROVED
      const { error } = await (svc as any).from('professional_documents').upsert(
        {
          professional_id: professionalId,
          document_type,
          status: 'VERIFIED',
          verified_at: now,
          verified_by: adminId,
          uploaded_at: now,
        },
        { onConflict: 'professional_id,document_type' }
      )
      if (error) return serverError(error.message)
      return ok({ ok: true })
    }

    if (action === 'REVOKE') {
      const { error } = await (svc as any)
        .from('professional_documents')
        .update({ status: 'ARCHIVED', verified_at: null, verified_by: null })
        .eq('professional_id', professionalId)
        .eq('document_type', document_type)
      if (error) return serverError(error.message)
      return ok({ ok: true })
    }

    return badRequest('action skal være APPROVE eller REVOKE')
  })
}
