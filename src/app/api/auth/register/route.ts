import { NextRequest } from 'next/server'
import { z } from 'zod'
import { created, badRequest, serverError } from '@/lib/api-response'
import { rateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit'
import { sendNotification, adminEmailBody } from '@/lib/notifications/service'

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  full_name: z.string().min(1),
  profession: z.enum(['TEACHER', 'PEDAGOGUE', 'NURSE', 'PSYCHOLOGIST', 'SOCIAL_WORKER', 'COUNSELOR', 'OTHER']).default('OTHER'),
})

// POST /api/auth/register — public, creates auth user + profile + professional record (WF-001)
export async function POST(request: NextRequest) {
  const ip = getClientIp(request)
  const { limited } = rateLimit(`register:${ip}`, { windowMs: 15 * 60 * 1000, max: 5 })
  if (limited) return rateLimitResponse()

  let body: unknown
  try { body = await request.json() } catch { return badRequest('Invalid JSON') }

  const parsed = RegisterSchema.safeParse(body)
  if (!parsed.success) return badRequest(parsed.error.issues.map(e => e.message).join(', '))

  const { createAnonClient, createServiceClient } = await import('@/lib/supabase/server')

  // Use signUp via anon client so Supabase sends the email confirmation email
  const anonDb = createAnonClient()
  const { data: signUpData, error: signUpError } = await anonDb.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.full_name,
        role: 'professional',
      },
    },
  })

  if (signUpError) {
    if (signUpError.message?.toLowerCase().includes('already registered')) {
      return badRequest('Email er allerede registreret')
    }
    return serverError(signUpError.message)
  }
  if (!signUpData.user) return serverError('Kunne ikke oprette bruger')

  const userId = signUpData.user.id

  // Create professionals record using service client (bypasses RLS)
  const db = createServiceClient()
  const { data: professional, error: proError } = await db
    .from('professionals')
    .insert({
      id: userId,
      profession: parsed.data.profession,
      status: 'REGISTERED',
      availability_status: 'UNAVAILABLE',
      capacity_hours_week: 0,
      // 1 was too tight a default — the same shape of silent-block bug as
      // capacity_hours_week and availability_status: a professional could
      // be activated, already have one case, and be permanently excluded
      // from a second because nobody thought to raise this. 3 matches the
      // fallback every admin screen already assumes (`?? 3`) when this was
      // null; admin can still lower or raise it per professional.
      max_concurrent_cases: 3,
      experience_years: 0,
    })
    .select()
    .single()

  if (proError || !professional) {
    // Roll back auth user creation to avoid orphaned accounts
    await db.auth.admin.deleteUser(userId)
    return serverError(proError?.message)
  }

  const { subject, body: emailBody } = adminEmailBody('PROFESSIONAL_APPLICATION_RECEIVED', userId)
  await sendNotification({
    db,
    notification_type: 'PROFESSIONAL_APPLICATION_RECEIVED',
    related_entity_type: 'professionals',
    related_entity_id: userId,
    recipient_email: process.env.SYSTEM_ADMIN_EMAIL,
    subject,
    body: emailBody,
  })

  return created({
    id: userId,
    email: parsed.data.email,
    full_name: parsed.data.full_name,
    professional_id: professional.id,
    status: professional.status,
    requires_email_confirmation: signUpData.session === null,
  })
}
