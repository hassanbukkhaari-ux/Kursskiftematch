import { NextRequest } from 'next/server'
import { createHash } from 'crypto'
import { z } from 'zod'
import { createServiceClient } from '@/lib/supabase/server'
import { ok, created, badRequest, serverError, withAdminAuth } from '@/lib/api-response'
import { logAuditEvent } from '@/lib/audit'
import { sendNotification, adminEmailBody } from '@/lib/notifications/service'
import { rateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit'
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
})

// POST /api/inbound-inquiries — public endpoint (no auth required, uses service role)
export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const { limited } = rateLimit(`inbound-inquiries:${ip}`, { windowMs: 15 * 60 * 1000, max: 5 })
  if (limited) return rateLimitResponse()

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

  // One-way hash for spam detection — SHA-256, not reversible like the
  // previous base64 encoding (which only obscured the IP, never hid it).
  const ip_hash = ip !== 'unknown'
    ? createHash('sha256').update(ip).digest('hex').substring(0, 16)
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
      // No captcha provider is wired up yet — a client-supplied boolean here
      // would be meaningless (trivially spoofable), so it's always recorded
      // as unverified rather than pretending to check something it can't.
      captcha_verified: false,
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
