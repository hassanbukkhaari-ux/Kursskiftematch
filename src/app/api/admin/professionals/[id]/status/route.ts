import { withAdminAuth } from '@/lib/api-response'
import { badRequest, ok, serverError } from '@/lib/api-response'
import { createClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'

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
