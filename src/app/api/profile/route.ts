import { withAuth } from '@/lib/api-response'
import { badRequest, ok, serverError } from '@/lib/api-response'
import { createClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'

const ALLOWED_FIELDS = new Set([
  'job_title', 'phone', 'address', 'postal_code', 'city', 'region',
  'profile_image_url', 'profession_type_id', 'specialization', 'authorization',
  'education', 'experience_years', 'bio',
  'max_hours_per_week', 'available_now', 'can_take_acute',
  'can_work_evening', 'can_work_weekend', 'can_work_night',
  'has_drivers_license', 'has_own_car', 'can_transport_citizen',
  'max_driving_radius_km', 'gender', 'daily_occupation',
])

export async function PATCH(request: NextRequest) {
  return withAuth(request, async (userId) => {
    let body: Record<string, unknown>
    try { body = await request.json() } catch { return badRequest('Invalid JSON') }

    const patch: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(body)) {
      if (ALLOWED_FIELDS.has(k)) patch[k] = v
    }

    if (Object.keys(patch).length === 0) return badRequest('No valid fields provided')

    const db = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dba = db as any

    // Upsert so the professional can edit even before admin creates their row
    const { error } = await dba.from('professionals').upsert(
      { id: userId, profession: 'OTHER', ...patch },
      { onConflict: 'id' }
    )

    if (error) return serverError(error.message)
    return ok({ ok: true })
  })
}
