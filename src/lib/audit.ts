import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Json } from '@/types/database'

type DB = Database

export async function logAuditEvent(
  db: SupabaseClient<DB>,
  params: {
    event_type: string
    actor_id?: string | null
    resource_type: string
    resource_id: string
    metadata?: Json
  }
): Promise<void> {
  const { error } = await db.from('audit_events').insert({
    event_type: params.event_type,
    actor_id: params.actor_id || null,
    resource_type: params.resource_type,
    resource_id: params.resource_id,
    metadata: params.metadata ?? {},
  })

  if (error) {
    console.error('[audit] Failed to log event:', params.event_type, error)
  }
}
