import { NextRequest } from 'next/server'
import { z } from 'zod'
import { created, badRequest, notFound, serverError, withAdminAuth } from '@/lib/api-response'
import { logAuditEvent } from '@/lib/audit'
import type { HandoverReason } from '@/types/database'

const HandoverSchema = z.object({
  reason: z.enum([
    'PROFESSIONAL_UNAVAILABLE',
    'WORKLOAD_EXCEEDED',
    'REQUEST_PROFESSIONAL',
    'REQUEST_CASE',
    'BETTER_MATCH',
    'SAFEGUARDING_CONCERN',
    'OTHER',
  ]),
  incoming_professional_id: z.string().uuid().nullable().optional(),
  handover_note: z.string().max(2000).optional(),
})

// POST /api/cases/:id/handover — initiate professional handover (WF-008, admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return withAdminAuth(request, async (userId) => {
    let body: unknown
    try { body = await request.json() } catch { return badRequest('Invalid JSON') }

    const parsed = HandoverSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.issues.map(e => e.message).join(', '))

    const { createClient } = await import('@/lib/supabase/server')
    const db = await createClient()

    // Verify case is ACTIVE
    const { data: caseData, error: caseError } = await db
      .from('cases')
      .select('id, status')
      .eq('id', id)
      .single()

    if (caseError || !caseData) return notFound('Case')
    if (caseData.status !== 'ACTIVE') {
      return badRequest(`Handover requires an ACTIVE case, current status: ${caseData.status}`)
    }

    // Get current active assignment — outgoing professional
    const { data: assignment, error: assignError } = await db
      .from('case_assignments')
      .select('professional_id')
      .eq('case_id', id)
      .is('ended_at', null)
      .single()

    if (assignError || !assignment) {
      return badRequest('No active professional assignment found for this case')
    }

    // Validate incoming professional exists if provided
    if (parsed.data.incoming_professional_id) {
      const { data: pro } = await db
        .from('professionals')
        .select('id, status')
        .eq('id', parsed.data.incoming_professional_id)
        .single()
      if (!pro) return notFound('Incoming professional')
      if (pro.status !== 'ACTIVE') {
        return badRequest('Incoming professional must have ACTIVE status')
      }
    }

    const { data, error } = await db
      .from('case_handovers')
      .insert({
        case_id: id,
        outgoing_professional_id: assignment.professional_id,
        incoming_professional_id: parsed.data.incoming_professional_id ?? null,
        reason: parsed.data.reason as HandoverReason,
        status: 'INITIATED',
        handover_note: parsed.data.handover_note ?? null,
        session_logs_transferred: false,
        created_by: userId,
      })
      .select()
      .single()

    if (error || !data) return serverError(error?.message)

    await logAuditEvent(db, {
      event_type: 'HANDOVER_INITIATED',
      actor_id: userId,
      resource_type: 'case_handovers',
      resource_id: data.id,
      metadata: {
        case_id: id,
        outgoing_professional_id: assignment.professional_id,
        incoming_professional_id: parsed.data.incoming_professional_id ?? null,
        reason: parsed.data.reason,
      },
    })

    return created(data)
  })
}
