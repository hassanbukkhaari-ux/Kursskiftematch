import { NextRequest } from 'next/server'
import { ok, serverError, withAdminAuth } from '@/lib/api-response'

// GET /api/notification-log — admin only
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    const { createClient } = await import('@/lib/supabase/server')
    const db = await createClient()
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const notification_type = searchParams.get('notification_type')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = db
      .from('notification_log')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (status) query = query.eq('status', status as 'PENDING' | 'SENT' | 'FAILED')
    if (notification_type) query = query.eq('notification_type', notification_type as 'INQUIRY_RECEIVED' | 'PROFESSIONAL_APPLICATION_RECEIVED' | 'CASE_CREATED' | 'SAFEGUARDING_FLAGGED' | 'HOURS_SUBMITTED' | 'DOCUMENT_ACTION_REQUIRED' | 'CASE_CLOSED')

    const { data, error, count } = await query
    if (error) return serverError()
    return ok({ data, count, limit, offset })
  })
}
