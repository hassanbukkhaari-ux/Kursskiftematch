import { NextRequest } from 'next/server'
import { ok, serverError, withAdminAuth } from '@/lib/api-response'

// GET /api/municipalities/[id]/cases
// Returns cases for a municipality including per-case sagsbehandler contact info
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return withAdminAuth(request, async () => {
    const { createServiceClient } = await import('@/lib/supabase/server')
    const db = createServiceClient()

    const { data, error } = await db
      .from('cases')
      .select('id, citizen_initials, citizen_age_range, status, case_number, intake_contact_name, intake_contact_email, intake_contact_phone')
      .eq('municipality_id', id)
      .order('created_at', { ascending: false })

    if (error) return serverError(error.message)

    return ok({ data: data ?? [] })
  })
}
