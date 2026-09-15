import { NextRequest } from 'next/server'
import { z } from 'zod'
import { withAdminAuth, badRequest, ok, serverError } from '@/lib/api-response'
import { createServiceClient } from '@/lib/supabase/server'
import { sendProfessionalInviteEmail } from '@/lib/professionals/invite-email'

const InviteSchema = z.object({
  email: z.string().email('Ugyldig e-mailadresse'),
  name: z.string().optional(),
})

export async function POST(request: NextRequest) {
  return withAdminAuth(request, async () => {
    let body: unknown
    try { body = await request.json() } catch { return badRequest('Invalid JSON') }

    const parsed = InviteSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.issues.map(e => e.message).join(', '))

    const { email, name } = parsed.data
    const db = createServiceClient()
    const { error } = await sendProfessionalInviteEmail(db, { email, name })
    if (error) return serverError(error)

    return ok({ ok: true, email })
  })
}
