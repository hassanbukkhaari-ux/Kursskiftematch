import { withAuth } from '@/lib/api-response'
import { badRequest, ok, serverError } from '@/lib/api-response'
import { createClient, createServiceClient } from '@/lib/supabase/server'
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

    // INSERT policy on professionals restricts to admin — use service client
    // to ensure the row exists, then the update goes through either way.
    const svc = createServiceClient()
    await (svc as any).from('professionals').upsert(
      { id: userId, profession: 'OTHER' },
      { onConflict: 'id', ignoreDuplicates: true }
    )

    const db = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dba = db as any

    const { error } = await dba.from('professionals').update(patch).eq('id', userId)

    if (error) return serverError(error.message)
    return ok({ ok: true })
  })
}
