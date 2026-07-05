import { NextRequest } from 'next/server'
import { ok, notFound, serverError, withAdminAuth } from '@/lib/api-response'

// GET /api/match-runs/:id — admin only
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return withAdminAuth(request, async () => {
    const { createClient } = await import('@/lib/supabase/server')
    const db = await createClient()

    const { data, error } = await db
      .from('match_runs')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !data) return notFound('Match run')
    return ok(data)
  })
}
