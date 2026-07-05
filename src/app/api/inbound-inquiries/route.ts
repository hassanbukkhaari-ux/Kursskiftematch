import { NextRequest } from 'next/server'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/server'
import { ok, created, badRequest, serverError, withAdminAuth } from '@/lib/api-response'
import { logAuditEvent } from '@/lib/audit'
import { sendNotification, adminEmailBody } from '@/lib/notifications/service'
import type { Json } from '@/types/database'

const InquirySchema = z.object({
  submission_type: z.enum(['MUNICIPALITY_INQUIRY', 'PROFESSIONAL_APPLICATION', 'PARTNER_LEAD']),
  submitter_name: z.string().min(1).max(200),
  submitter_email: z.string().email(),
  submitter_phone: z.string().optional(),
  organization_name: z.string().optional(),
  message: z.string().optional(),
  form_data: z.record(z.string(), z.unknown()).default({}),
  source_url: z.string().url().optional(),
  captcha_verified: z.boolean().default(false),
})

// POST /api/inbound-inquiries — public endpoint (no auth required, uses service role)
export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return badRequest('Invalid JSON')
  }

  const parsed = InquirySchema.safeParse(body)
  if (!parsed.success) {
    return badRequest(parsed.error.issues.map(e => e.message).join(', '))
  }

  const data = parsed.data
  const db = createServiceClient()

  // Capture IP hash for spam detection (hash for privacy)
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0]?.trim() || 'unknown'
  const ip_hash = ip !== 'unknown'
    ? Buffer.from(ip).toString('base64').substring(0, 16)
    : null

  const { data: inquiry, error } = await db
    .from('inbound_inquiries')
    .insert({
      submission_type: data.submission_type,
      submitter_name: data.submitter_name,
      submitter_email: data.submitter_email,
      submitter_phone: data.submitter_phone || null,
      organization_name: data.organization_name || null,
      message: data.message || null,
      form_data: data.form_data as Json,
      source_url: data.source_url || null,
      ip_hash,
      captcha_verified: data.captcha_verified,
    })
    .select('id, submission_type, status, submitted_at')
    .single()

  if (error || !inquiry) {
    console.error('[inbound-inquiries] Insert failed:', error)
    return serverError()
  }

  // ADR-010 notification
  const notifType = data.submission_type === 'PROFESSIONAL_APPLICATION'
    ? 'PROFESSIONAL_APPLICATION_RECEIVED'
    : 'INQUIRY_RECEIVED'

  const { subject, body: emailBody } = adminEmailBody(notifType, inquiry.id)
  await sendNotification({
    db,
    notification_type: notifType,
    related_entity_type: 'inbound_inquiries',
    related_entity_id: inquiry.id,
    recipient_email: process.env.SYSTEM_ADMIN_EMAIL,
    subject,
    body: emailBody,
  })

  return created({ id: inquiry.id, status: inquiry.status, submitted_at: inquiry.submitted_at })
}

// GET /api/inbound-inquiries — admin only
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    const { createClient } = await import('@/lib/supabase/server')
    const db = await createClient()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = db.from('inbound_inquiries').select('*', { count: 'exact' })

    if (status) query = query.eq('status', status as 'PENDING' | 'REVIEWED' | 'CONVERTED' | 'REJECTED' | 'SPAM')
    if (type) query = query.eq('submission_type', type as 'MUNICIPALITY_INQUIRY' | 'PROFESSIONAL_APPLICATION' | 'PARTNER_LEAD')

    query = query.order('submitted_at', { ascending: false }).range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) return serverError()
    return ok({ data, count, limit, offset })
  })
}
