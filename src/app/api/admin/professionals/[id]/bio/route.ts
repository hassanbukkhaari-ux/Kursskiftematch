import { withAdminAuth, badRequest, ok, serverError, notFound } from '@/lib/api-response'
import { createServiceClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'

// POST /api/admin/professionals/:id/bio — admin approves or rejects a
// professional's self-written "Om mig som kontaktperson" bio before it can
// ever be shown to a municipality (see 20260913000006_professional_bio_review
// for why this gate exists — GDPR data-separation, not quality control).
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: professionalId } = await params
  return withAdminAuth(request, async (adminId) => {
    let body: { action?: string; note?: string }
    try { body = await request.json() } catch { return badRequest('Invalid JSON') }

    const { action, note } = body
    if (action !== 'APPROVE' && action !== 'REJECT') {
      return badRequest('action skal være APPROVE eller REJECT')
    }
    if (action === 'REJECT' && !note?.trim()) {
      return badRequest('En begrundelse er påkrævet ved afvisning')
    }

    const svc = createServiceClient()

    const { data: pro } = await (svc as any)
      .from('professionals')
      .select('bio, bio_status')
      .eq('id', professionalId)
      .single()

    if (!pro) return notFound('Professional')
    if (!pro.bio || pro.bio_status !== 'PENDING_REVIEW') {
      return badRequest('Der er ingen tekst der afventer godkendelse')
    }

    const now = new Date().toISOString()
    const { error } = await (svc as any)
      .from('professionals')
      .update({
        bio_status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
        bio_reviewed_at: now,
        bio_reviewed_by: adminId,
        bio_review_note: action === 'REJECT' ? note!.trim() : null,
      })
      .eq('id', professionalId)

    if (error) return serverError(error.message)
    return ok({ ok: true })
  })
}
