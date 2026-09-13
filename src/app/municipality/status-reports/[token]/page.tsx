import { createServiceClient } from '@/lib/supabase/server'
import { CompassMark } from '@/components/brand/compass'
import { REPORT_TYPE_LABEL } from '@/lib/labels'

const CONCERN_LABEL: Record<string, string> = {
  NONE: 'Ingen bekymring', MINOR: 'Lettere bekymring', CONCERN: 'Bekymring der kræver opmærksomhed',
}
const ASSESSMENT_LABEL: Record<string, string> = {
  ON_TRACK: 'Forløbet kører planmæssigt', ADJUSTING: 'Forløbet justeres', RECOMMEND_CLOSE: 'Anbefales afsluttet',
}
const FIELD_LABEL: Record<string, string> = {
  everyday_situation: 'Hverdagssituation',
  work_focus: 'Fokus i indsatsen',
  progress_resources: 'Fremskridt og ressourcer',
  challenges: 'Udfordringer',
  collaboration: 'Samarbejde',
  recommendation: 'Anbefaling',
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('da-DK', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso))
}

interface PageProps {
  params: Promise<{ token: string }>
}

// Public, no-login page — the municipality's sagsbehandler reaches this from
// the "Godkend og send til kommune" email link. View-only, no response
// needed. GDPR: only case_number + citizen initials/age range identify the
// case; the report body is the professional's own prose as admin reviewed
// and approved it.
export default async function StatusReportViewPage({ params }: PageProps) {
  const { token } = await params
  const db = createServiceClient()

  const { data: report } = await (db as any)
    .from('status_reports')
    .select(`
      period_start, period_end, everyday_situation, work_focus, progress_resources,
      challenges, concern_level, concern_text, collaboration, recommendation,
      overall_assessment, overall_assessment_note, shared_with_municipality_at,
      status_report_requests(report_type, cases(case_number, citizen_initials, citizen_age_range))
    `)
    .eq('response_token', token)
    .maybeSingle()

  const isActive = report?.shared_with_municipality_at

  return (
    <div className="min-h-screen flex flex-col items-center bg-[#F6F3EE] px-4 py-10">
      <div className="w-full max-w-[560px] bg-white rounded-2xl border border-[#E0DAD0] shadow-[0_4px_24px_rgba(28,56,41,0.08)] px-6 py-8 sm:px-8 sm:py-10">
        <div className="flex items-center gap-2.5 mb-8">
          <CompassMark size={32} />
          <div className="font-serif font-semibold text-[#1C3829] text-[15px] leading-none">Kursskifte</div>
        </div>

        {!isActive ? (
          <div>
            <h1 className="font-serif text-xl font-semibold text-[#1A1F1C] mb-2">Ikke aktivt</h1>
            <p className="text-sm text-[#6B7569]">Dette link findes ikke eller er ikke længere aktivt — kontakt Kursskifte hvis du mener det er en fejl.</p>
          </div>
        ) : (
          <>
            <h1 className="font-serif text-2xl font-semibold text-[#1A1F1C] mb-1">
              {REPORT_TYPE_LABEL[report.status_report_requests?.report_type] ?? 'Statusrapport'}
            </h1>
            <p className="text-sm text-[#6B7569] mb-1">
              {report.status_report_requests?.cases?.case_number ?? ''}
            </p>
            <p className="text-sm text-[#6B7569] mb-6">
              Borger {report.status_report_requests?.cases?.citizen_initials ?? '—'} · {report.status_report_requests?.cases?.citizen_age_range ?? '—'}
              {' · '}{formatDate(report.period_start)} – {formatDate(report.period_end)}
            </p>

            <div className="space-y-5">
              {(['everyday_situation', 'work_focus', 'progress_resources', 'challenges', 'collaboration', 'recommendation'] as const)
                .filter(field => report[field])
                .map(field => (
                  <div key={field}>
                    <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-1.5">{FIELD_LABEL[field]}</div>
                    <p className="text-sm text-[#1A1F1C] whitespace-pre-wrap leading-relaxed">{report[field]}</p>
                  </div>
                ))}

              {report.concern_level && report.concern_level !== 'NONE' && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-amber-800 mb-1.5">
                    {CONCERN_LABEL[report.concern_level] ?? report.concern_level}
                  </div>
                  {report.concern_text && <p className="text-sm text-[#1A1F1C] whitespace-pre-wrap">{report.concern_text}</p>}
                </div>
              )}

              {report.overall_assessment && (
                <div>
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-1.5">Samlet faglig vurdering</div>
                  <p className="text-sm font-medium text-[#1A1F1C] mb-1">{ASSESSMENT_LABEL[report.overall_assessment] ?? report.overall_assessment}</p>
                  {report.overall_assessment_note && (
                    <p className="text-sm text-[#1A1F1C] whitespace-pre-wrap leading-relaxed">{report.overall_assessment_note}</p>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>
      <p className="mt-6 text-xs text-[#6B7569]">Kursskiftematch · kursskifte.dk</p>
    </div>
  )
}
