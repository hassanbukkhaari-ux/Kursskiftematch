import { notFound } from 'next/navigation'
import { createServiceClient } from '@/lib/supabase/server'
import { PrintButton } from './PrintButton'

const REPORT_TYPE_LABEL: Record<string, string> = {
  MONTHLY: 'Kort månedlig status',
  EXTENDED: 'Udvidet statusrapport',
  FINAL: 'Afsluttende statusrapport',
}

const CONCERN_LABEL: Record<string, string> = {
  NONE: 'Ingen bekymring',
  MINOR: 'Lettere bekymring',
  CONCERN: 'Bekymring der kræver opmærksomhed',
}

const ASSESSMENT_LABEL: Record<string, string> = {
  ON_TRACK: 'Forløbet kører planmæssigt',
  ADJUSTING: 'Forløbet justeres',
  RECOMMEND_CLOSE: 'Anbefales afsluttet',
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function PrintStatusReportPage({ params }: PageProps) {
  const { id } = await params
  const svc = createServiceClient() as any

  const { data, error } = await svc
    .from('status_report_requests')
    .select(`
      id, case_id, report_type, deadline, promised_date, status, created_at,
      cases!inner(citizen_initials, citizen_age_range),
      professionals!inner(profession, profiles!inner(full_name, email)),
      status_reports(*)
    `)
    .eq('id', id)
    .single()

  if (error || !data || !data.status_reports?.[0]) notFound()

  const report = data.status_reports[0]
  const printDate = new Date().toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' })
  const periodStr = report.period_start && report.period_end
    ? `${new Date(report.period_start).toLocaleDateString('da-DK', { day: 'numeric', month: 'long' })} – ${new Date(report.period_end).toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' })}`
    : '—'

  const fields = [
    { label: 'Borgerens hverdagssituation og trivsel', value: report.everyday_situation },
    { label: 'Hvad har I arbejdet med i perioden?', value: report.work_focus },
    { label: 'Konkrete fremskridt og borgerens ressourcer', value: report.progress_resources },
    { label: 'Udfordringer og barrierer i perioden', value: report.challenges },
    report.concern_text ? { label: 'Bekymring — uddybning', value: report.concern_text } : null,
    { label: 'Samarbejde med borger og netværk', value: report.collaboration },
    { label: 'Faglig anbefaling fremadrettet', value: report.recommendation },
    report.overall_assessment_note ? { label: 'Uddybning af samlet vurdering', value: report.overall_assessment_note } : null,
  ].filter(Boolean) as { label: string; value: string }[]

  return (
    <>
      {/* Hide shell elements when printing */}
      <style>{`
        @media print {
          aside, header { display: none !important; }
          main { margin-left: 0 !important; padding-top: 0 !important; }
          [data-no-print] { display: none !important; }
          body { background: white !important; }
          @page { margin: 20mm 18mm; size: A4; }
        }
      `}</style>

      <div className="max-w-3xl mx-auto px-6 py-8">

        {/* Screen-only toolbar */}
        <div data-no-print="true" className="flex items-center justify-between mb-8 pb-4 border-b border-[#E0DAD0]">
          <a href={`/admin/status-reports/${id}`} className="text-sm text-[#6B7569] hover:text-[#1A1F1C] flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Tilbage
          </a>
          <PrintButton />
        </div>

        {/* Document header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.15em] text-[#6B7569] mb-1">Kursskifte</div>
            <h1 className="text-2xl font-serif font-semibold text-[#1A1F1C] leading-snug">
              {REPORT_TYPE_LABEL[data.report_type] ?? data.report_type}
            </h1>
            <p className="text-sm text-[#6B7569] mt-1">
              Borger {data.cases.citizen_initials} · {data.cases.citizen_age_range}
            </p>
          </div>
          <div className="text-right text-xs text-[#9B9589] shrink-0 mt-1">
            <div>Udskrevet {printDate}</div>
            {report.submitted_at && (
              <div className="mt-0.5">Indsendt {new Date(report.submitted_at).toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
            )}
          </div>
        </div>

        {/* Meta grid */}
        <div className="grid grid-cols-2 gap-x-8 gap-y-3 mb-8 pb-8 border-b border-[#E0DAD0] text-sm">
          <MetaRow label="Kontaktperson" value={data.professionals?.profiles?.full_name ?? '—'} />
          <MetaRow label="Periode" value={periodStr} />
          <MetaRow label="Frist" value={new Date(data.deadline).toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' })} />
          <MetaRow label="Bekymringsniveau" value={CONCERN_LABEL[report.concern_level] ?? '—'} />
          <MetaRow label="Faglig vurdering" value={ASSESSMENT_LABEL[report.overall_assessment] ?? '—'} />
        </div>

        {/* Report fields */}
        <div className="space-y-7">
          {fields.map(field => (
            <div key={field.label}>
              <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#6B7569] mb-2">
                {field.label}
              </div>
              <p className="text-sm text-[#1A1F1C] leading-relaxed whitespace-pre-wrap">{field.value ?? '—'}</p>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-[#E0DAD0] flex items-center justify-between text-xs text-[#9B9589]">
          <span>Kursskifte · kursskifte.dk</span>
          <span>Borger {data.cases.citizen_initials} · {REPORT_TYPE_LABEL[data.report_type]}</span>
        </div>
      </div>
    </>
  )
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#9B9589] mb-0.5">{label}</div>
      <div className="text-[#1A1F1C] font-medium">{value}</div>
    </div>
  )
}
