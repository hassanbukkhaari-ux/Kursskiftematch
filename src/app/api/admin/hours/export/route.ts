import { NextRequest, NextResponse } from 'next/server'
import { withAdminAuth, badRequest } from '@/lib/api-response'
import { WORK_TYPE_LABEL } from '@/lib/labels'

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`
  return value
}

// GET /api/admin/hours/export?from=YYYY-MM-DD&to=YYYY-MM-DD&professional_id=...
// Exports every APPROVED registered_hours row in the period — a separate,
// uncapped query from the 200-row admin list page, since payroll needs the
// full period, not just the most recent submissions. CSV, grouped by
// professional with a per-person subtotal row.
export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    const { searchParams } = new URL(request.url)
    const from = searchParams.get('from')
    const to = searchParams.get('to')
    const professionalId = searchParams.get('professional_id') || undefined

    if (!from || !to) return badRequest('from og to (YYYY-MM-DD) er påkrævet')

    const { createClient } = await import('@/lib/supabase/server')
    const db = await createClient()
    const dba = db as any // eslint-disable-line @typescript-eslint/no-explicit-any

    let query = dba
      .from('registered_hours')
      .select('id, case_id, professional_id, work_date, work_type, hours, description')
      .eq('status', 'APPROVED')
      .gte('work_date', from)
      .lte('work_date', to)
      .order('work_date', { ascending: true })

    if (professionalId) query = query.eq('professional_id', professionalId)

    const { data: rows } = await query
    const hours = rows ?? []

    const caseIds = [...new Set(hours.map((h: any) => h.case_id).filter(Boolean))]
    const profIds = [...new Set(hours.map((h: any) => h.professional_id).filter(Boolean))]

    const [{ data: cases }, { data: profs }] = await Promise.all([
      caseIds.length > 0
        ? dba.from('cases').select('id, citizen_initials, citizen_age_range').in('id', caseIds)
        : Promise.resolve({ data: [] }),
      profIds.length > 0
        ? dba.from('profiles').select('id, full_name').in('id', profIds)
        : Promise.resolve({ data: [] }),
    ])

    const caseMap = Object.fromEntries((cases ?? []).map((c: any) => [c.id, c]))
    const profMap = Object.fromEntries((profs ?? []).map((p: any) => [p.id, p]))

    const byProfessional = new Map<string, typeof hours>()
    for (const h of hours) {
      const list = byProfessional.get(h.professional_id) ?? []
      list.push(h)
      byProfessional.set(h.professional_id, list)
    }

    const lines: string[] = []
    lines.push(['Fagperson', 'Dato', 'Borger', 'Type', 'Timer', 'Beskrivelse'].map(csvEscape).join(','))

    const sortedProfIds = [...byProfessional.keys()].sort((a, b) =>
      (profMap[a]?.full_name ?? '').localeCompare(profMap[b]?.full_name ?? '', 'da')
    )

    let grandTotal = 0
    for (const proId of sortedProfIds) {
      const profName = profMap[proId]?.full_name ?? 'Ukendt'
      const rowsForPro = byProfessional.get(proId) ?? []
      let subtotal = 0
      for (const h of rowsForPro) {
        const c = caseMap[h.case_id]
        const typeLabel = String(h.work_type).split(',').map((t: string) => WORK_TYPE_LABEL[t] ?? t).join(' + ')
        lines.push([
          profName,
          h.work_date,
          c ? `${c.citizen_initials} (${c.citizen_age_range})` : '',
          typeLabel,
          String(h.hours),
          h.description ?? '',
        ].map((v: string) => csvEscape(v)).join(','))
        subtotal += Number(h.hours) || 0
      }
      lines.push(['', '', '', `Subtotal ${profName}`, subtotal.toFixed(2), ''].map(csvEscape).join(','))
      grandTotal += subtotal
    }
    lines.push(['', '', '', 'Total', grandTotal.toFixed(2), ''].map(csvEscape).join(','))

    const csv = '﻿' + lines.join('\r\n')
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="timer_${from}_${to}.csv"`,
      },
    })
  })
}
