import { createServiceClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { badRequest, ok, serverError } from '@/lib/api-response'
import type { NextRequest } from 'next/server'

export async function POST(request: NextRequest) {
  let body: { email?: string }
  try { body = await request.json() } catch { return badRequest('Invalid JSON') }

  const email = body.email?.trim().toLowerCase()
  if (!email) return badRequest('E-mail mangler')

  const svc = createServiceClient()

  // Check if a user with this email exists
  const { data: users, error: listError } = await svc.auth.admin.listUsers({ perPage: 1000 })
  if (listError) return serverError(listError.message)

  const exists = users.users.some(u => u.email?.toLowerCase() === email)
  if (!exists) {
    return badRequest('Denne e-mail er ikke registreret i systemet.')
  }

  // Use the SSR client so the PKCE verifier is set in cookies on the response
  const supabase = await createClient()
  const redirectTo = `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://kursskifte.dk'}/auth/callback`
  const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo })

  if (error) return serverError(error.message)
  return ok({ sent: true })
}
