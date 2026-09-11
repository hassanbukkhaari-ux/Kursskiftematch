import { NextRequest } from 'next/server'
import { withAdminAuth, ok, badRequest, serverError } from '@/lib/api-response'
import { createServiceClient } from '@/lib/supabase/server'

// PATCH /api/admin/professionals/[id] — edit profile fields
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return withAdminAuth(request, async () => {
    let body: Record<string, unknown>
    try { body = await request.json() } catch { return badRequest('Invalid JSON') }

    const { full_name, email, phone, job_title, address, postal_code, city, region } = body as Record<string, string | null>

    const svc = createServiceClient() as any
    const now = new Date().toISOString()

    // Update professionals table fields
    const proUpdate: Record<string, unknown> = { updated_at: now }
    if (phone !== undefined) proUpdate.phone = phone ?? null
    if (job_title !== undefined) proUpdate.job_title = job_title ?? null
    if (address !== undefined) proUpdate.address = address ?? null
    if (postal_code !== undefined) proUpdate.postal_code = postal_code ?? null
    if (city !== undefined) proUpdate.city = city ?? null
    if (region !== undefined) proUpdate.region = region ?? null

    if (Object.keys(proUpdate).length > 1) {
      const { error } = await svc.from('professionals').update(proUpdate).eq('id', id)
      if (error) return serverError(error.message)
    }

    // Update profiles table fields
    const profileUpdate: Record<string, unknown> = {}
    if (full_name !== undefined) profileUpdate.full_name = full_name ?? null
    if (email !== undefined) profileUpdate.email = email ?? null

    if (Object.keys(profileUpdate).length > 0) {
      const { error } = await svc.from('profiles').update(profileUpdate).eq('id', id)
      if (error) return serverError(error.message)
    }

    return ok({ ok: true })
  })
}

// DELETE /api/admin/professionals/[id] — archive (soft delete) the professional
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return withAdminAuth(request, async () => {
    const svc = createServiceClient() as any

    // Check there are no active cases
    const { data: activeCases } = await svc
      .from('v_cases_with_professional')
      .select('id')
      .eq('professional_id', id)
      .neq('status', 'ARCHIVED')
      .limit(1)

    if (activeCases?.length) {
      return badRequest('Fagpersonen har aktive sager og kan ikke arkiveres. Afslut eller overfør sagerne først.')
    }

    const { error } = await svc
      .from('professionals')
      .update({ status: 'ARCHIVED', updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) return serverError(error.message)
    return ok({ ok: true })
  })
}
