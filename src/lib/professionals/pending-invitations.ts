import type { SupabaseClient } from '@supabase/supabase-js'

export type PendingInvitation = {
  id: string
  email: string
  full_name: string | null
  invited_at: string
  opened: boolean
}

// A professionals row is only created the first time someone saves anything
// on their profile (see ensureProfessionalRecord) — so an invited auth user
// with no professionals row yet is exactly "invited, never finished". Admin
// invites (unlike the public /signup page) always set invited_at, so that's
// the signal that separates the two origins.
// The admin Users API (auth.admin.listUsers) is a separate, less reliable
// hop than a normal table query — it's the same GoTrue admin endpoint we've
// seen hit multi-second latency and errors under load elsewhere in this
// app. A rejected call here used to crash the entire Kontaktpersoner page
// (this function ran uncaught inside page.tsx's Promise.all) even though
// the actual professionals list loaded fine — so every failure mode is
// caught and degrades to an empty pending-invitations list instead.
export async function getPendingInvitations(svc: SupabaseClient): Promise<PendingInvitation[]> {
  try {
    const { data: usersRes, error: usersError } = await svc.auth.admin.listUsers({ page: 1, perPage: 1000 })
    if (usersError || !usersRes) {
      console.error('[getPendingInvitations] Failed to list auth users:', usersError)
      return []
    }

    const invited = usersRes.users.filter(u => !!u.invited_at)
    if (invited.length === 0) return []

    const { data: existingPros, error: prosError } = await (svc as any)
      .from('professionals')
      .select('id')
      .in('id', invited.map(u => u.id))

    if (prosError) {
      console.error('[getPendingInvitations] Failed to load professionals for cross-reference:', prosError)
      return []
    }

    const onboardedIds = new Set((existingPros ?? []).map((p: { id: string }) => p.id))

    return invited
      .filter(u => !onboardedIds.has(u.id))
      .map(u => ({
        id: u.id,
        email: u.email ?? '',
        full_name: (u.user_metadata?.full_name as string | undefined) ?? null,
        invited_at: u.invited_at as string,
        opened: !!u.last_sign_in_at,
      }))
      .sort((a, b) => new Date(a.invited_at).getTime() - new Date(b.invited_at).getTime())
  } catch (err) {
    console.error('[getPendingInvitations] Unexpected failure, degrading to empty list:', err)
    return []
  }
}
