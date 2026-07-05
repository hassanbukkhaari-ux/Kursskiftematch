import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, notFound, badRequest, serverError, withAdminAuth } from '@/lib/api-response'
import { logAuditEvent } from '@/lib/audit'
import type { Database } from '@/types/database'

const UpdateSchema = z.object({
  status: z.enum(['REVIEWED', 'CONVERTED', 'REJECTED', 'SPAM']).optional(),
  rejection_reason: z.string().optional(),
  converted_to_type: z.enum(['case', 'professional']).optional(),
  converted_to_id: z.string().uuid().optional(),
})

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return withAdminAuth(request, async () => {
    const { createClient } = await import('@/lib/supabase/server')
    const db = await createClient()
    const { data, error } = await db.from('inbound_inquiries').select('*').eq('id', id).single()
    if (error || !data) return notFound('Inquiry')
    return ok(data)
  })
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return withAdminAuth(request, async (userId) => {
    const { createClient } = await import('@/lib/supabase/server')
    const db = await createClient()

    let body: unknown
    try { body = await request.json() } catch { return badRequest('Invalid JSON') }

    const parsed = UpdateSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.issues.map(e => e.message).join(', '))

    type InquiryUpdate = Database['public']['Tables']['inbound_inquiries']['Update']
    const update: InquiryUpdate = {
      ...parsed.data,
      ...(parsed.data.status
        ? { reviewed_by: userId, reviewed_at: new Date().toISOString() }
        : {}),
    }

    const { data, error } = await db
      .from('inbound_inquiries')
      .update(update)
      .eq('id', id)
      .select()
      .single()

    if (error || !data) return notFound('Inquiry')

    await logAuditEvent(db, {
      event_type: 'INQUIRY_UPDATED',
      actor_id: userId,
      resource_type: 'inbound_inquiries',
      resource_id: id,
      metadata: { status: parsed.data.status },
    })

    return ok(data)
  })
}
