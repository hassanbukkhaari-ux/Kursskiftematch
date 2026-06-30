import { withAuth } from '@/lib/api-response'
import { badRequest, ok, serverError } from '@/lib/api-response'
import { createClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'

type SelectionConfig = { table: string; field: string; max?: number }

const CONFIGS: Record<string, SelectionConfig> = {
  competencies:   { table: 'professional_competencies',   field: 'competency_type_id', max: 5 },
  methods:        { table: 'professional_methods',        field: 'method_type_id' },
  'target-groups':{ table: 'professional_target_groups',  field: 'target_group_type_id' },
  'work-tasks':   { table: 'professional_work_tasks',     field: 'work_task_type_id' },
  languages:      { table: 'professional_languages',      field: 'language_type_id' },
  geography:      { table: 'professional_geography',      field: 'municipality_id' },
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ type: string }> }
) {
  const { type } = await params
  const config = CONFIGS[type]
  if (!config) return badRequest(`Unknown selection type: ${type}`)

  return withAuth(request, async (userId) => {
    let body: { ids?: unknown }
    try { body = await request.json() } catch { return badRequest('Invalid JSON') }

    if (!Array.isArray(body.ids)) return badRequest('ids must be an array')
    const ids = body.ids as string[]

    if (config.max && ids.length > config.max) {
      return badRequest(`Maximum ${config.max} selections allowed`)
    }

    const db = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dba = db as any

    // Ensure professionals record exists before inserting junction rows
    await db.from('professionals').upsert(
      { id: userId, profession: 'OTHER' },
      { onConflict: 'id', ignoreDuplicates: true }
    )

    // Replace all selections atomically
    const { error: delErr } = await dba
      .from(config.table)
      .delete()
      .eq('professional_id', userId)

    if (delErr) return serverError(delErr.message)

    if (ids.length > 0) {
      const rows = ids.map(id => ({ professional_id: userId, [config.field]: id }))
      const { error: insErr } = await dba.from(config.table).insert(rows)
      if (insErr) return serverError(insErr.message)
    }

    return ok({ ok: true, count: ids.length })
  })
}
