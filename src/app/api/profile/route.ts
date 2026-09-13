import { withAuth } from '@/lib/api-response'
import { badRequest, ok, serverError } from '@/lib/api-response'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { ensureProfessionalRecord } from '@/lib/professionals/ensure-record'
import type { NextRequest } from 'next/server'

const ALLOWED_FIELDS = new Set([
  'job_title', 'phone', 'address', 'postal_code', 'city', 'region',
  'profile_image_url', 'profession_type_id', 'specialization', 'authorization_note',
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

    // Standard full-time work week (37 timer) is the legal cap here — a
    // professional can never self-declare more; only an admin editing
    // capacity_hours_week directly can go higher.
    const WEEKLY_HOURS_CAP = 37
    if (typeof patch.max_hours_per_week === 'number' && patch.max_hours_per_week > WEEKLY_HOURS_CAP) {
      return badRequest(`Maks. timer pr. uge kan ikke være over ${WEEKLY_HOURS_CAP} (fuld arbejdstid).`)
    }

    // INSERT policy on professionals restricts to admin — use service client
    // to ensure the row exists (and notify admin, the first time), then the
    // update goes through either way.
    const svc = createServiceClient()
    await ensureProfessionalRecord(svc, userId)

    const db = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dba = db as any

    if (typeof patch.max_hours_per_week === 'number' || typeof patch.available_now === 'boolean') {
      const { data: existing } = await dba
        .from('professionals')
        .select('capacity_hours_week, availability_status')
        .eq('id', userId)
        .single()

      // capacity_hours_week (what matching actually uses) is only ever
      // changed by an admin editing the profile directly. Only seeding it
      // once — while still at the untouched 0 default — left it stuck at
      // whatever that first value was: a professional who later revised
      // their own declared hours upward (e.g. 10 -> 37) saw nothing change
      // for matching, since capacity was no longer 0. The professional is
      // the one who actually knows their own availability, so their number
      // always wins here now; an admin who needs a stricter cap for
      // workload reasons still sets that on their own edit form.
      if (typeof patch.max_hours_per_week === 'number') {
        patch.capacity_hours_week = patch.max_hours_per_week
      }

      // The "Ledig nu" toggle on this page writes available_now, but
      // matching's eligibility check (v_professionals_available) reads a
      // completely different column, availability_status — one only an
      // admin's edit form ever touched. The toggle looked like it controlled
      // availability for matching; it did nothing at all. Keep the two in
      // sync for the common on/off case, without overwriting an admin's more
      // specific PARTIALLY_AVAILABLE (e.g. during a partial leave).
      if (typeof patch.available_now === 'boolean' && existing?.availability_status !== 'PARTIALLY_AVAILABLE') {
        patch.availability_status = patch.available_now ? 'AVAILABLE' : 'UNAVAILABLE'
      }
    }

    const { error } = await dba.from('professionals').update(patch).eq('id', userId)

    if (error) return serverError(error.message)
    return ok({ ok: true })
  })
}
