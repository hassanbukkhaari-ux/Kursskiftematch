import { withAuth } from '@/lib/api-response'
import { badRequest, ok, serverError } from '@/lib/api-response'
import { createClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'

const VALID_CONSENT_TYPES = new Set([
  'GDPR', 'PRIVACY', 'CONFIDENTIALITY', 'ETHICS', 'TERMS', 'DOCUMENT_STORAGE',
])

export async function POST(request: NextRequest) {
  return withAuth(request, async (userId) => {
    let body: { consent_type?: string; document_version?: string }
    try { body = await request.json() } catch { return badRequest('Invalid JSON') }

    if (!body.consent_type || !VALID_CONSENT_TYPES.has(body.consent_type)) {
      return badRequest('Invalid consent_type')
    }

    const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim()
      ?? request.headers.get('x-real-ip')
      ?? null

    const db = await createClient()

    // Ensure professionals record exists
    await db.from('professionals').upsert(
      { id: userId, profession: 'OTHER' },
      { onConflict: 'id', ignoreDuplicates: true }
    )

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dba = db as any
    const { error } = await dba.from('professional_consents').upsert(
      {
        professional_id: userId,
        consent_type: body.consent_type,
        accepted_at: new Date().toISOString(),
        ip_address: ip,
        document_version: body.document_version ?? '1.0',
      },
      { onConflict: 'professional_id,consent_type' }
    )

    if (error) return serverError(error.message)
    return ok({ ok: true })
  })
}
