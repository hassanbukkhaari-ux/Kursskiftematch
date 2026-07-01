import { NextRequest } from 'next/server'
import { Resend } from 'resend'
import { ok, notFound, badRequest, serverError, withAdminAuth } from '@/lib/api-response'
import { adminEmailBody } from '@/lib/notifications/service'

// POST /api/notification-log/:id/retry — admin only, retry a FAILED notification
// Updates the original log entry (does not create a duplicate row).
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return withAdminAuth(request, async () => {
    const { createClient } = await import('@/lib/supabase/server')
    const db = await createClient()

    const { data: notification, error: fetchError } = await db
      .from('notification_log')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !notification) return notFound('Notification')
    if (notification.status !== 'FAILED') return badRequest('Only FAILED notifications can be retried')
    if (notification.attempt_count >= 3) return badRequest('Maximum retry attempts (3) reached')

    // Use stored content when available; fall back to regenerating from template
    const stored = notification.subject && notification.body_text
      ? { subject: notification.subject, body: notification.body_text }
      : adminEmailBody(notification.notification_type, notification.related_entity_id)

    const email = notification.recipient_email || process.env.SYSTEM_ADMIN_EMAIL!

    type NotifUpdate = {
      status: 'SENT' | 'FAILED'
      attempt_count: number
      sent_at?: string | null
      failed_at?: string | null
      failure_reason?: string | null
    }
    let updatePayload: NotifUpdate
    try {
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: 'Kursskiftematch <noreply@kursskiftematch.dk>',
        to: email,
        subject: stored.subject,
        text: stored.body,
      })
      updatePayload = {
        status: 'SENT',
        sent_at: new Date().toISOString(),
        failed_at: null,
        failure_reason: null,
        attempt_count: notification.attempt_count + 1,
      }
    } catch (err) {
      updatePayload = {
        status: 'FAILED',
        failed_at: new Date().toISOString(),
        failure_reason: err instanceof Error ? err.message : String(err),
        attempt_count: notification.attempt_count + 1,
      }
    }

    const { data: updated, error: updateError } = await db
      .from('notification_log')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single()

    if (updateError || !updated) return serverError()
    return ok(updated)
  })
}
