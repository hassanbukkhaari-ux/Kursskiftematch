import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createServiceClient } from '@/lib/supabase/server'
import { PageHeader, ContentContainer } from '@/components/layout/page-header'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { AdminStatusReportActions } from './AdminStatusReportActions'
import { REPORT_TYPE_LABEL } from '@/lib/labels'

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Afventer',
  ACKNOWLEDGED: 'Bekræftet',
  SUBMITTED: 'Indsendt',
  REVIEWED: 'Gennemset',
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

const ASSESSMENT_BADGE: Record<string, 'green' | 'amber' | 'default'> = {
  ON_TRACK: 'green',
  ADJUSTING: 'amber',
  RECOMMEND_CLOSE: 'default',
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function AdminStatusReportDetailPage({ params }: PageProps) {
  const { id } = await params
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

  if (error || !data) notFound()

  const report = data.status_reports?.[0] ?? null
  const deadlineDate = new Date(data.deadline)
  const today = new Date()
  const isOverdue = deadlineDate < today && data.status !== 'SUBMITTED' && data.status !== 'REVIEWED'

  return (
    <div>
      <PageHeader
        label="Statusrapporter"
        title={`${REPORT_TYPE_LABEL[data.report_type] ?? data.report_type} — Borger ${data.cases.citizen_initials}`}
        subtitle={`${data.professionals?.profiles?.full_name ?? 'Ukendt'} · Frist ${deadlineDate.toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' })}`}
        breadcrumb={[
          { label: 'Kursskifte Administration', href: '/admin' },
          { label: 'Statusrapporter', href: '/admin/status-reports' },
          { label: `Borger ${data.cases.citizen_initials}` },
        ]}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {isOverdue && <Badge variant="red">Forfalden</Badge>}
            <Badge variant={data.status === 'SUBMITTED' ? 'green' : data.status === 'ACKNOWLEDGED' ? 'brand' : data.status === 'REVIEWED' ? 'default' : 'amber'} dot>
              {STATUS_LABEL[data.status] ?? data.status}
            </Badge>
            {(data.status === 'SUBMITTED' || data.status === 'REVIEWED') && (
              <Link
                href={`/admin/status-reports/${id}/print`}
                target="_blank"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#E0DAD0] text-xs font-medium text-[#1A1F1C] hover:bg-[#F0EDE8] transition-colors"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 6 2 18 2 18 9" />
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                  <rect x="6" y="14" width="12" height="8" />
                </svg>
                Download PDF
              </Link>
            )}
            <AdminStatusReportActions
              requestId={id}
              status={data.status}
              isOverdue={isOverdue}
              professionalName={data.professionals?.profiles?.full_name ?? 'Kontaktpersonen'}
              sharedWithMunicipalityAt={report?.shared_with_municipality_at ?? null}
            />
          </div>
        }
      />
      <ContentContainer>
        {/* Request details */}
        <Card className="mb-6">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-3">Anmodningsdetaljer</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            <InfoBlock label="Kontaktperson" value={data.professionals?.profiles?.full_name ?? 'Ukendt'} />
            <InfoBlock label="Email" value={data.professionals?.profiles?.email ?? '—'} />
            <div className="bg-[#F6F3EE] rounded-xl p-3">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-1">Borger</div>
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-medium text-[#1A1F1C]">{data.cases.citizen_initials} · {data.cases.citizen_age_range}</div>
                <Link
                  href={`/admin/cases/${data.case_id}`}
                  target="_blank"
                  className="shrink-0 inline-flex items-center gap-1 text-[10px] font-semibold text-[#1C3829] hover:underline"
                >
                  Åbn sag
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                </Link>
              </div>
            </div>
            <InfoBlock label="Frist" value={deadlineDate.toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' })} />
            {data.promised_date && (
              <InfoBlock label="Lovet levering" value={new Date(data.promised_date).toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' })} />
            )}
            <InfoBlock label="Anmodet" value={new Date(data.created_at).toLocaleDateString('da-DK', { day: 'numeric', month: 'long', year: 'numeric' })} />
          </div>
          {data.message && (
            <div className="bg-[#F6F3EE] rounded-xl p-3">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-1">Besked til kontaktpersonen</div>
              <p className="text-sm text-[#1A1F1C] whitespace-pre-wrap">{data.message}</p>
            </div>
          )}
        </Card>

        {/* Report */}
        {report ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#6B7569]">Rapport</span>
              <div className="flex-1 h-px bg-[#E0DAD0]" />
              {report.overall_assessment && (
                <Badge variant={ASSESSMENT_BADGE[report.overall_assessment] ?? 'default'}>
                  {ASSESSMENT_LABEL[report.overall_assessment]}
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InfoBlock label="Periode" value={
                report.period_start && report.period_end
                  ? `${new Date(report.period_start).toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })} – ${new Date(report.period_end).toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' })}`
                  : '—'
              } />
              {report.concern_level && (
                <div className="bg-[#F6F3EE] rounded-xl p-3">
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-1">Bekymringsniveau</div>
                  <Badge variant={report.concern_level === 'CONCERN' ? 'red' : report.concern_level === 'MINOR' ? 'amber' : 'green'}>
                    {CONCERN_LABEL[report.concern_level]}
                  </Badge>
                </div>
              )}
            </div>

            {[
              { label: 'Borgerens hverdagssituation og trivsel', value: report.everyday_situation },
              { label: 'Hvad har I arbejdet med?', value: report.work_focus },
              { label: 'Konkrete fremskridt og ressourcer', value: report.progress_resources },
              { label: 'Udfordringer i perioden', value: report.challenges },
              { label: 'Bekymring — uddybning', value: report.concern_text, hide: !report.concern_text },
              { label: 'Samarbejde med borger og netværk', value: report.collaboration },
              { label: 'Faglig anbefaling fremadrettet', value: report.recommendation },
              { label: 'Uddybning af samlet vurdering', value: report.overall_assessment_note, hide: !report.overall_assessment_note },
            ].filter(f => !f.hide && f.value).map(field => (
              <Card key={field.label} className="!p-4">
                <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-2">{field.label}</div>
                <p className="text-sm text-[#1A1F1C] whitespace-pre-wrap leading-relaxed">{field.value}</p>
              </Card>
            ))}

            <p className="text-xs text-[#9B9589] text-right">
              Indsendt {report.submitted_at ? new Date(report.submitted_at).toLocaleString('da-DK', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
            </p>
          </div>
        ) : (
          <Card className="text-center py-10">
            <p className="text-sm text-[#6B7569]">
              {data.status === 'PENDING' ? 'Kontaktpersonen har endnu ikke bekræftet anmodningen.' :
               data.status === 'ACKNOWLEDGED' ? 'Kontaktpersonen har bekræftet og arbejder på rapporten.' :
               'Ingen rapport indsendt endnu.'}
            </p>
          </Card>
        )}
      </ContentContainer>
    </div>
  )
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#F6F3EE] rounded-xl p-3">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-1">{label}</div>
      <div className="text-sm font-medium text-[#1A1F1C]">{value}</div>
    </div>
  )
}
