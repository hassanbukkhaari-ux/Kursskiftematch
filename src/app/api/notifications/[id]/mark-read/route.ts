import { NextRequest } from 'next/server'
import { ok, notFound, serverError, withAuth } from '@/lib/api-response'

// PATCH /api/notifications/:id/mark-read — any authenticated user, but only
// for their own notification (recipient_profile_id = self). UPDATE on
// notification_log is admin-only at the RLS layer, so this route checks
// ownership itself and writes via the service client — writes stay
// centralized through routes like this one rather than a broader RLS
// UPDATE grant.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return withAuth(request, async (userId) => {
    const { createServiceClient } = await import('@/lib/supabase/server')
    const svc = createServiceClient() as any // eslint-disable-line @typescript-eslint/no-explicit-any

    const { data: notification, error: fetchError } = await svc
      .from('notification_log')
      .select('id, recipient_profile_id')
      .eq('id', id)
      .single()

    if (fetchError || !notification) return notFound('Notification')
    if (notification.recipient_profile_id !== userId) return notFound('Notification')

    const { error } = await svc
      .from('notification_log')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id)

    if (error) return serverError(error.message)
    return ok({ ok: true })
  })
}
