import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageHeader, ContentContainer, SectionHeader } from '@/components/layout/page-header'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import AdminCaseActionsClient, { type Grant, type AvailableProfessional } from './AdminCaseActionsClient'

const STATUS_LABEL: Record<string, string> = {
  OPEN: 'Åben', MATCHED: 'Matchet', ACTIVE: 'Aktiv', COMPLETED: 'Afsluttet', ARCHIVED: 'Arkiveret',
}
const STATUS_BADGE: Record<string, 'amber' | 'brand' | 'green' | 'default'> = {
  OPEN: 'amber', MATCHED: 'brand', ACTIVE: 'green', COMPLETED: 'default', ARCHIVED: 'default',
}
const COMPLEXITY_LABEL: Record<string, string> = {
  LOW: 'Lav', MEDIUM: 'Mellem', HIGH: 'Høj', CRITICAL: 'Kritisk',
}
const COMPLEXITY_BADGE: Record<string, 'green' | 'amber' | 'red'> = {
  LOW: 'green', MEDIUM: 'amber', HIGH: 'red', CRITICAL: 'red',
}
const GENDER_LABEL: Record<string, string> = {
  MALE: 'Dreng/mand', FEMALE: 'Pige/kvinde', OTHER: 'Andet',
}

interface PageProps {
  params: Promise<{ id: string }>
}

export default async function AdminCasePage({ params }: PageProps) {
  const { id } = await params
  const db = await createClient()
  const dba = db as any

  const { data: caseData } = await db
    .from('v_cases_with_professional')
    .select('*')
    .eq('id', id)
    .single()

  if (!caseData) notFound()

  const [
    muniRes,
    logsRes,
    caseDetailRes,
    tagsRes,
    problemAreasRes,
    goalsRes,
    specialWishesRes,
    grantsRes,
    prosRes,
  ] = await Promise.all([
    db.from('municipalities').select('name, sagsbehandler_name, sagsbehandler_email').eq('id', caseData.municipality_id).single(),
    db.from('session_logs').select('id, session_date, duration_minutes, professional_id', { count: 'exact' }).eq('case_id', id).order('session_date', { ascending: false }).limit(5),
    db.from('cases').select('citizen_gender, citizen_notes').eq('id', id).single(),
    db.from('v_case_tags').select('problem_area_codes, goal_codes, special_wish_codes').eq('case_id', id).single(),
    db.from('problem_areas').select('code, label_da'),
    db.from('goals_lookup').select('code, label_da'),
    db.from('special_wishes_lookup').select('code, label_da'),
    dba.from('case_grants').select('id, granted_hours, period_start, period_end, status, approved_at').eq('case_id', id).order('period_start', { ascending: false }),
    dba.from('professionals').select('id, profiles!inner(full_name)').eq('status', 'ACTIVE'),
  ])

  const labelMap = (rows: { code: string; label_da: string }[] | null) =>
    Object.fromEntries((rows ?? []).map(r => [r.code, r.label_da]))
  const problemAreaLabels = labelMap(problemAreasRes.data)
  const goalLabels = labelMap(goalsRes.data)
  const specialWishLabels = labelMap(specialWishesRes.data)

  const professional = caseData.professional_id
    ? await db.from('professionals').select('profession, experience_years, profiles!inner(full_name, email)').eq('id', caseData.professional_id).single()
    : null

  const proData = professional?.data as unknown as {
    profession: string
    experience_years: number
    profiles: { full_name: string; email: string }
  } | null

  const PROFESSION_LABEL: Record<string, string> = {
    TEACHER: 'Lærer', PEDAGOGUE: 'Pædagog', NURSE: 'Sygeplejerske',
    PSYCHOLOGIST: 'Psykolog', SOCIAL_WORKER: 'Socialrådgiver', COUNSELOR: 'Vejleder', OTHER: 'Andet',
  }

  const grants: Grant[] = (grantsRes.data ?? []).map((g: any) => ({
    id: g.id,
    granted_hours: g.granted_hours,
    period_start: g.period_start,
    period_end: g.period_end,
    status: g.status,
    approved_at: g.approved_at,
  }))

  const availableProfessionals: AvailableProfessional[] = (prosRes.data ?? []).map((p: any) => ({
    id: p.id,
    full_name: p.profiles?.full_name ?? '',
  })).filter((p: AvailableProfessional) => p.full_name)

  return (
    <div>
      <PageHeader
        label="Sag"
        title={`Borger ${caseData.citizen_initials}`}
        subtitle={`${caseData.citizen_age_range} · ${muniRes.data?.name ?? 'Ukendt kommune'}`}
        breadcrumb={[
          { label: 'Administration', href: '/admin' },
          { label: 'Sager', href: '/admin/cases' },
          { label: `Borger ${caseData.citizen_initials}` },
        ]}
        actions={
          <Badge
            variant={STATUS_BADGE[caseData.status] ?? 'default'}
            dot
          >
            {STATUS_LABEL[caseData.status] ?? caseData.status}
          </Badge>
        }
      />

      <ContentContainer>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left column */}
          <div className="lg:col-span-2 space-y-6">

            {/* Case info */}
            <Card>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-4">Sagsoplysninger</div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <InfoBlock label="Kompleksitet">
                  <Badge variant={COMPLEXITY_BADGE[caseData.complexity_level] ?? 'default'}>
                    {COMPLEXITY_LABEL[caseData.complexity_level] ?? caseData.complexity_level}
                  </Badge>
                </InfoBlock>
                <InfoBlock label="Ugentlige timer">
                  <span className="font-semibold text-[#1A1F1C]">{caseData.weekly_hours} t/uge</span>
                </InfoBlock>
                <InfoBlock label="Aldersgruppe">
                  <span className="font-semibold text-[#1A1F1C]">{caseData.citizen_age_range}</span>
                </InfoBlock>
                {caseDetailRes.data?.citizen_gender && (
                  <InfoBlock label="Køn">
                    <span className="font-semibold text-[#1A1F1C]">
                      {GENDER_LABEL[caseDetailRes.data.citizen_gender] ?? caseDetailRes.data.citizen_gender}
                    </span>
                  </InfoBlock>
                )}
                {caseData.active_grant_hours !== null && (
                  <InfoBlock label="Bevilgede timer">
                    <span className="font-semibold text-[#1A1F1C]">{caseData.active_grant_hours} t</span>
                  </InfoBlock>
                )}
                {caseData.approved_hours_used > 0 && (
                  <InfoBlock label="Timer brugt">
                    <span className="font-semibold text-[#1A1F1C]">{caseData.approved_hours_used} t</span>
                  </InfoBlock>
                )}
              </div>
              {caseDetailRes.data?.citizen_notes && (
                <div className="mt-4 pt-4 border-t border-[#E0DAD0]">
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-1.5">Noter</div>
                  <p className="text-sm text-[#1A1F1C] whitespace-pre-wrap">{caseDetailRes.data.citizen_notes}</p>
                </div>
              )}
            </Card>

            {/* Intake tags: problem areas, goals, special wishes */}
            {((tagsRes.data?.problem_area_codes?.length ?? 0) > 0 ||
              (tagsRes.data?.goal_codes?.length ?? 0) > 0 ||
              (tagsRes.data?.special_wish_codes?.length ?? 0) > 0) && (
              <Card>
                <div className="space-y-4">
                  {(tagsRes.data?.problem_area_codes?.length ?? 0) > 0 && (
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-2">Problemområder</div>
                      <div className="flex flex-wrap gap-1.5">
                        {tagsRes.data!.problem_area_codes!.map(code => (
                          <span key={code} className="text-xs bg-[#FEF2E2] border border-[#F5DDB0] rounded-lg px-2 py-1 text-[#92660A]">
                            {problemAreaLabels[code] ?? code}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {(tagsRes.data?.goal_codes?.length ?? 0) > 0 && (
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-2">Mål</div>
                      <div className="flex flex-wrap gap-1.5">
                        {tagsRes.data!.goal_codes!.map(code => (
                          <span key={code} className="text-xs bg-[#EEF4F0] border border-[#D1E7D8] rounded-lg px-2 py-1 text-[#1C3829]">
                            {goalLabels[code] ?? code}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {(tagsRes.data?.special_wish_codes?.length ?? 0) > 0 && (
                    <div>
                      <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-2">Ønsker til kontaktperson</div>
                      <div className="flex flex-wrap gap-1.5">
                        {tagsRes.data!.special_wish_codes!.map(code => (
                          <span key={code} className="text-xs bg-[#F6F3EE] border border-[#E0DAD0] rounded-lg px-2 py-1 text-[#6B7569]">
                            {specialWishLabels[code] ?? code}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Session logs */}
            <div>
              <SectionHeader
                title="Seneste sessionslog"
                description={`${logsRes.count ?? 0} sessioner i alt`}
              />
              {(logsRes.data?.length ?? 0) === 0 ? (
                <Card className="text-center py-10 text-[#6B7569] text-sm">
                  Ingen sessionslogs registreret endnu
                </Card>
              ) : (
                <div className="space-y-2">
                  {logsRes.data?.map(log => (
                    <Card key={log.id} className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B7569" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        <span className="text-sm text-[#1A1F1C]">
                          {new Intl.DateTimeFormat('da-DK', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(log.session_date))}
                        </span>
                      </div>
                      {log.duration_minutes && (
                        <span className="text-xs text-[#6B7569]">{log.duration_minutes} min.</span>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-4">

            {/* Assigned professional */}
            <Card>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-3">Tildelt fagperson</div>
              {proData ? (
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#EEF4F0] flex items-center justify-center text-sm font-semibold text-[#1C3829] shrink-0">
                    {proData.profiles.full_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-[#1A1F1C] text-sm">{proData.profiles.full_name}</div>
                    <div className="text-xs text-[#6B7569]">
                      {PROFESSION_LABEL[proData.profession] ?? proData.profession}
                      {proData.experience_years > 0 && ` · ${proData.experience_years} år`}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-[#6B7569]">Ingen fagperson tildelt endnu</div>
              )}
            </Card>

            {/* Municipality contact */}
            {muniRes.data && (
              <Card>
                <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-3">Kommunekontakt</div>
                <div className="space-y-1.5">
                  <div className="text-sm font-medium text-[#1A1F1C]">{muniRes.data.name}</div>
                  {muniRes.data.sagsbehandler_name && (
                    <div className="text-xs text-[#6B7569]">{muniRes.data.sagsbehandler_name}</div>
                  )}
                  {muniRes.data.sagsbehandler_email && (
                    <a href={`mailto:${muniRes.data.sagsbehandler_email}`} className="text-xs text-[#1C3829] hover:underline block">
                      {muniRes.data.sagsbehandler_email}
                    </a>
                  )}
                </div>
              </Card>
            )}

            {/* Matching action for open/matched cases */}
            {(caseData.status === 'OPEN' || caseData.status === 'MATCHED') && (
              <Card>
                <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-3">Matching</div>
                <Link
                  href={`/admin/matching/new?case_id=${caseData.id}`}
                  className="flex items-center justify-between w-full h-10 px-4 bg-[#1C3829] text-[#F6F3EE] rounded-xl text-sm font-semibold hover:bg-[#2D5840] transition-colors"
                >
                  <span>Start matching</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </Link>
              </Card>
            )}

            {/* Dynamic admin actions: close, archive, grants, handover */}
            <AdminCaseActionsClient
              caseId={id}
              currentStatus={caseData.status}
              grants={grants}
              professionals={availableProfessionals}
            />
          </div>
        </div>
      </ContentContainer>
    </div>
  )
}

function InfoBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-[#F6F3EE] rounded-xl p-3">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-1.5">{label}</div>
      {children}
    </div>
  )
}
