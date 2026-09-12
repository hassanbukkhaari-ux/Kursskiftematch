import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import { sendNotification, adminEmailBody } from '@/lib/notifications/service'

// The public /signup page creates the auth user directly via Supabase's
// client-side signUp() — a database trigger gives them a profiles row, but
// nothing creates their professionals row or tells admin a new professional
// has shown up. This is the first place either of those actually happens:
// called (with a service client, since INSERT on professionals requires
// is_admin()) the first time a freshly signed-up professional saves
// anything about their profile, from onboarding onward.
export async function ensureProfessionalRecord(svc: SupabaseClient<Database>, userId: string): Promise<void> {
  const { data: existing } = await (svc as any)
    .from('professionals')
    .select('id')
    .eq('id', userId)
    .maybeSingle()

  if (existing) return

  const { error } = await (svc as any).from('professionals').insert({
    id: userId,
    profession: 'OTHER',
    status: 'REGISTERED',
    availability_status: 'UNAVAILABLE',
    capacity_hours_week: 0,
    max_concurrent_cases: 10,
    experience_years: 0,
  })

  if (error) {
    if (error.code === '23505') return // created concurrently — fine
    console.error('[ensureProfessionalRecord] Failed to create professionals row:', error)
    return
  }

  const { subject, body } = adminEmailBody('PROFESSIONAL_APPLICATION_RECEIVED', userId)
  await sendNotification({
    db: svc,
    notification_type: 'PROFESSIONAL_APPLICATION_RECEIVED',
    related_entity_type: 'professionals',
    related_entity_id: userId,
    recipient_email: process.env.SYSTEM_ADMIN_EMAIL,
    subject,
    body,
  })
}
