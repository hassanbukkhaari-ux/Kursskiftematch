import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient, createServiceClient } from '@/lib/supabase/server'

const PatchSchema = z.object({
  status: z.enum(['REVIEWED']).optional(),
  deadline: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
}).refine(v => v.status !== undefined || v.deadline !== undefined, {
  message: 'Ingen felter at opdatere',
})

// PATCH /api/admin/status-report-requests/[id] — mark as reviewed / adjust deadline
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const db = await createClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let body: unknown
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const parsed = PatchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues.map(e => e.message).join(', ') }, { status: 400 })
  }

  const svc = createServiceClient() as any

  if (parsed.data.status === 'REVIEWED') {
    const { data: existing } = await svc
      .from('status_report_requests')
      .select('status')
      .eq('id', id)
      .single()
    if (!existing) return NextResponse.json({ error: 'Ikke fundet' }, { status: 404 })
    if (existing.status !== 'SUBMITTED') {
      return NextResponse.json({ error: 'Kun indsendte rapporter kan markeres som gennemset' }, { status: 400 })
    }
  }

  const { error } = await svc
    .from('status_report_requests')
    .update({ ...parsed.data, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

// GET /api/admin/status-report-requests/[id] — get single request with report
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const db = await createClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: profile } = await db.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const svc = createServiceClient() as any
  const { data, error } = await svc
    .from('status_report_requests')
    .select(`
      id, case_id, report_type, deadline, promised_date, status, message, created_at,
      cases!inner(citizen_initials, citizen_age_range, complexity_level),
      professionals!inner(profession, profiles!inner(full_name, email)),
      status_reports(*)
    `)
    .eq('id', id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
