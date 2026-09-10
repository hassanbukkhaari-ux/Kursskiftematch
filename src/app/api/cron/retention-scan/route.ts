import { NextRequest, NextResponse } from 'next/server'

// GET /api/cron/retention-scan — called by Vercel Cron, scans for expired retention dates (WF-013)
export async function GET(request: NextRequest) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Cron secret not configured' }, { status: 500 })
  }
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { createServiceClient } = await import('@/lib/supabase/server')
  const db = createServiceClient()
  const now = new Date().toISOString()

  // Find expired cases not yet scheduled for deletion
  const { data: expiredCases, error: caseError } = await db
    .from('cases')
    .select('id, data_retention_expires_at')
    .lt('data_retention_expires_at', now)
    .in('status', ['COMPLETED', 'ARCHIVED'])

  if (caseError) {
    return NextResponse.json({ error: 'Failed to scan cases' }, { status: 500 })
  }

  const scheduled: string[] = []
  const errors: string[] = []

  for (const c of expiredCases || []) {
    // Check if not already scheduled
    const { data: existing } = await db
      .from('deletion_schedules')
      .select('id')
      .eq('record_type', 'cases')
      .eq('record_id', c.id)
      .is('executed_at', null)
      .single()

    if (existing) continue

    const deletionDate = new Date()
    deletionDate.setDate(deletionDate.getDate() + 30) // 30-day grace period

    const { error } = await db.from('deletion_schedules').insert({
      record_type: 'cases',
      record_id: c.id,
      scheduled_for_deletion_at: deletionDate.toISOString(),
      retention_expired_at: c.data_retention_expires_at ?? now,
      reason: 'RETENTION_EXPIRED',
    })

    if (error) {
      errors.push(c.id)
    } else {
      scheduled.push(c.id)
    }
  }

  return NextResponse.json({
    scanned: expiredCases?.length || 0,
    scheduled: scheduled.length,
    errors: errors.length,
    scheduled_ids: scheduled,
  })
}
