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
export async function getPendingInvitations(svc: SupabaseClient): Promise<PendingInvitation[]> {
  const { data: usersRes, error: usersError } = await svc.auth.admin.listUsers({ page: 1, perPage: 1000 })
  if (usersError || !usersRes) {
    console.error('[getPendingInvitations] Failed to list auth users:', usersError)
    return []
  }

  const invited = usersRes.users.filter(u => !!u.invited_at)
  if (invited.length === 0) return []

  const { data: existingPros } = await (svc as any)
    .from('professionals')
    .select('id')
    .in('id', invited.map(u => u.id))

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
}
