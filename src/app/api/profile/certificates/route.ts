import { withAuth } from '@/lib/api-response'
import { badRequest, created, ok, serverError } from '@/lib/api-response'
import { createClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  return withAuth(request, async (userId) => {
    let body: Record<string, unknown>
    try { body = await request.json() } catch { return badRequest('Invalid JSON') }

    if (!body.certificate_type_id && !body.custom_name) {
      return badRequest('certificate_type_id or custom_name required')
    }

    const db = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dba = db as any

    await db.from('professionals').upsert(
      { id: userId, profession: 'OTHER' },
      { onConflict: 'id', ignoreDuplicates: true }
    )

    const { data, error } = await dba
      .from('professional_certificates')
      .insert({
        professional_id: userId,
        certificate_type_id: body.certificate_type_id ?? null,
        custom_name: body.custom_name ?? null,
        issued_at: body.issued_at ?? null,
        expires_at: body.expires_at ?? null,
        status: 'ACTIVE',
      })
      .select('id')
      .single()

    if (error) return serverError(error.message)
    return created(data)
  })
}
