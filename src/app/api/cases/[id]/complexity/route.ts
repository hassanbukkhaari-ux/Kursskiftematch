import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, badRequest, serverError, withAdminAuth } from '@/lib/api-response'
import { logAuditEvent } from '@/lib/audit'
import { calculateComplexityLevel } from '@/lib/matching/algorithm'

const ComplexityFactorsSchema = z.object({
  violence: z.boolean().default(false),
  substance_use: z.boolean().default(false),
  mental_health: z.boolean().default(false),
  criminality: z.boolean().default(false),
  family_instability: z.boolean().default(false),
  school: z.boolean().default(false),
  multiple_agencies: z.boolean().default(false),
  diagnosis: z.string().optional(),
  notes: z.string().optional(),
})

// POST/PATCH /api/cases/:id/complexity — admin only, upserts complexity factors + recalculates level
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handler(request, params)
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handler(request, params)
}

async function handler(
  request: NextRequest,
  params: Promise<{ id: string }>
) {
  const { id } = await params
  return withAdminAuth(request, async (userId) => {
    let body: unknown
    try { body = await request.json() } catch { return badRequest('Invalid JSON') }

    const parsed = ComplexityFactorsSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.issues.map(e => e.message).join(', '))

    const { createClient } = await import('@/lib/supabase/server')
    const db = await createClient()

    const factors = parsed.data
    const complexityLevel = calculateComplexityLevel({
      violence: factors.violence,
      substance_use: factors.substance_use,
      mental_health: factors.mental_health,
      criminality: factors.criminality,
      family_instability: factors.family_instability,
      school: factors.school,
      multiple_agencies: factors.multiple_agencies,
    })

    // Upsert complexity factors
    const { data: factorRow, error: factorError } = await db
      .from('case_complexity_factors')
      .upsert({
        case_id: id,
        ...factors,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'case_id' })
      .select()
      .single()

    if (factorError || !factorRow) return serverError(factorError?.message)

    // Update case's computed complexity_level
    const { error: caseError } = await db
      .from('cases')
      .update({ complexity_level: complexityLevel, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (caseError) return serverError(caseError.message)

    await logAuditEvent(db, {
      event_type: 'CASE_COMPLEXITY_UPDATED',
      actor_id: userId,
      resource_type: 'cases',
      resource_id: id,
      metadata: { complexity_level: complexityLevel, factors },
    })

    return ok({ ...factorRow, computed_complexity_level: complexityLevel })
  })
}
