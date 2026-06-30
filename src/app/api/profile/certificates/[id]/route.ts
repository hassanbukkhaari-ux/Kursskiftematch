import { withAuth } from '@/lib/api-response'
import { badRequest, forbidden, noContent, serverError } from '@/lib/api-response'
import { createClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return withAuth(request, async (userId, role) => {
    const db = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dba = db as any
    const { data, error } = await dba
      .from('professional_certificates')
      .select('professional_id')
      .eq('id', id)
      .single()

    if (error || !data) return badRequest('Certificate not found')
    if (data.professional_id !== userId && role !== 'admin') return forbidden()

    const { error: delErr } = await dba
      .from('professional_certificates')
      .delete()
      .eq('id', id)

    if (delErr) return serverError(delErr.message)
    return noContent()
  })
}
