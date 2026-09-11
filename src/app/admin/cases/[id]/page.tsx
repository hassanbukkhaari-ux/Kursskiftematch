import { notFound } from 'next/navigation'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { PageHeader, ContentContainer, SectionHeader } from '@/components/layout/page-header'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import AdminCaseActionsClient, { type Grant, type AvailableProfessional } from './AdminCaseActionsClient'
import CaseDocumentsClient from './CaseDocumentsClient'
import { CaseSessionLogsClient, type CaseSessionLog } from './CaseSessionLogsClient'
import type { HandoverReason, HandoverStatus } from '@/types/database'

const STATUS_LABEL: Record<string, string> = {
  OPEN: 'Åben', MATCHED: 'Matchet', PROPOSED: 'Forslag sendt', ACTIVE: 'Aktiv', COMPLETED: 'Afsluttet', ARCHIVED: 'Arkiveret',
}
const STATUS_BADGE: Record<string, 'amber' | 'brand' | 'green' | 'default'> = {
  OPEN: 'amber', MATCHED: 'brand', PROPOSED: 'amber', ACTIVE: 'green', COMPLETED: 'default', ARCHIVED: 'default',
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
const HANDOVER_REASON_LABEL: Record<HandoverReason, string> = {
  PROFESSIONAL_UNAVAILABLE: 'Fagperson utilgængelig',
  WORKLOAD_EXCEEDED: 'For høj arbejdsbyrde',
  REQUEST_PROFESSIONAL: 'Ønske fra fagperson',
  REQUEST_CASE: 'Ønske fra borger/sag',
  BETTER_MATCH: 'Bedre match tilgængeligt',
  SAFEGUARDING_CONCERN: 'Bekymring for borger',
  OTHER: 'Andet',
}
const HANDOVER_STATUS_LABEL: Record<HandoverStatus, string> = {
  INITIATED: 'Initieret',
  IN_PROGRESS: 'Igangværende',
  COMPLETED: 'Afsluttet',
  CANCELLED: 'Annulleret',
}
const HANDOVER_STATUS_BADGE: Record<HandoverStatus, 'amber' | 'brand' | 'green' | 'default'> = {
  INITIATED: 'amber',
  IN_PROGRESS: 'brand',
  COMPLETED: 'green',
  CANCELLED: 'default',
}

interface HandoverRow {
  id: string
  reason: HandoverReason
  status: HandoverStatus
  handover_note: string | null
  is_urgent: boolean
  session_logs_transferred: boolean
  created_at: string
  completed_at: string | null
  outgoing_name: string
  incoming_name: string | null
  created_by_name: string
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
    handoversRes,
  ] = await Promise.all([
    db.from('municipalities').select('name, sagsbehandler_name, sagsbehandler_email').eq('id', caseData.municipality_id).single(),
    createServiceClient().from('session_logs' as any).select('id, session_date, duration_minutes, observations, citizen_mood_tone, follow_up_needed, follow_up_reason, status, professional_id', { count: 'exact' }).eq('case_id', id).order('session_date', { ascending: false }).limit(20),
    dba.from('cases').select('citizen_gender, citizen_notes, intake_contact_name, intake_contact_email').eq('id', id).single(),
    db.from('v_case_tags').select('problem_area_codes, goal_codes, special_wish_codes').eq('case_id', id).single(),
    db.from('problem_areas').select('code, label_da'),
    db.from('goals_lookup').select('code, label_da'),
    db.from('special_wishes_lookup').select('code, label_da'),
    dba.from('case_grants').select('id, granted_hours, period_start, period_end, status, activated_at').eq('case_id', id).order('period_start', { ascending: false }),
    createServiceClient().from('professionals' as any).select('id, profiles!inner(full_name)').eq('status', 'ACTIVE'),
    dba.from('case_handovers').select('id, reason, status, handover_note, is_urgent, session_logs_transferred, created_at, completed_at, outgoing_professional_id, incoming_professional_id, created_by').eq('case_id', id).order('created_at', { ascending: false }),
  ])

  const labelMap = (rows: { code: string; label_da: string }[] | null) =>
    Object.fromEntries((rows ?? []).map(r => [r.code, r.label_da]))
  const problemAreaLabels = labelMap(problemAreasRes.data)
  const goalLabels = labelMap(goalsRes.data)
  const specialWishLabels = labelMap(specialWishesRes.data)

  const professional = caseData.professional_id
    ? await (createServiceClient() as any).from('professionals').select('profession, experience_years, profiles!inner(full_name, email)').eq('id', caseData.professional_id).single()
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

  // Build a professional_id → full_name map for session log display
  const logProfessionalIds = [...new Set((logsRes.data ?? []).map((l: any) => l.professional_id as string).filter(Boolean))]
  const logProfilesRes = logProfessionalIds.length > 0
    ? await createServiceClient().from('profiles' as any).select('id, full_name').in('id', logProfessionalIds)
    : { data: [] }
  const logProfileMap: Record<string, string> = Object.fromEntries(
    ((logProfilesRes.data ?? []) as any[]).map((p: any) => [p.id, p.full_name])
  )

  const grants: Grant[] = (grantsRes.data ?? []).map((g: any) => ({
    id: g.id,
    granted_hours: g.granted_hours,
    period_start: g.period_start,
    period_end: g.period_end,
    status: g.status,
    activated_at: g.activated_at ?? null,
  }))

  const availableProfessionals: AvailableProfessional[] = (prosRes.data ?? [])
    .map((p: any) => ({ id: p.id, full_name: p.profiles?.full_name ?? '' }))
    .filter((p: AvailableProfessional) => p.full_name)

  // Resolve names for handover history
  const handoverRawList: any[] = handoversRes.data ?? []
  const handovers: HandoverRow[] = await Promise.all(
    handoverRawList.map(async (h: any) => {
      const svc = createServiceClient() as any
      const [outRes, inRes, byRes] = await Promise.all([
        svc.from('professionals').select('profiles!inner(full_name)').eq('id', h.outgoing_professional_id).single(),
        h.incoming_professional_id
          ? svc.from('professionals').select('profiles!inner(full_name)').eq('id', h.incoming_professional_id).single()
          : Promise.resolve({ data: null }),
        svc.from('profiles').select('full_name').eq('id', h.created_by).single(),
      ])
      return {
        id: h.id,
        reason: h.reason as HandoverReason,
        status: h.status as HandoverStatus,
        handover_note: h.handover_note,
        is_urgent: h.is_urgent ?? false,
        session_logs_transferred: h.session_logs_transferred,
        created_at: h.created_at,
        completed_at: h.completed_at,
        outgoing_name: outRes.data?.profiles?.full_name ?? 'Ukendt',
        incoming_name: inRes.data?.profiles?.full_name ?? null,
        created_by_name: byRes.data?.full_name ?? 'Admin',
      }
    })
  )

  function fmt(iso: string) {
    return new Intl.DateTimeFormat('da-DK', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso))
  }

  return (
    <div>
      <PageHeader
        label="Sag"
        title={`Borger ${caseData.citizen_initials}`}
        subtitle={`${caseData.citizen_age_range} · ${muniRes.data?.name ?? 'Ukendt kommune'}`}
        breadcrumb={[
          { label: 'Kursskifte Administration', href: '/admin' },
          { label: 'Sager', href: '/admin/cases' },
          { label: `Borger ${caseData.citizen_initials}` },
        ]}
        actions={
          <Badge variant={STATUS_BADGE[caseData.status] ?? 'default'} dot>
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
                <InfoBlock label="Hastighed">
                  {caseData.urgency === 'AKUT' && <span className="font-semibold text-red-700">🔴 Akut (24 timer)</span>}
                  {caseData.urgency === 'HURTIG' && <span className="font-semibold text-amber-700">🟡 Hurtig</span>}
                  {(!caseData.urgency || caseData.urgency === 'NORMAL') && <span className="font-semibold text-[#6B7569]">⚪ Normal</span>}
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

            {/* Intake tags */}
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

            {/* Handover history */}
            {handovers.length > 0 && (
              <div>
                <SectionHeader
                  title="Overdragelseshistorik"
                  description={`${handovers.length} ${handovers.length === 1 ? 'overdragelse' : 'overdragelser'}`}
                />
                <div className="space-y-2">
                  {handovers.map(h => (
                    <Card key={h.id}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            {h.is_urgent && (
                              <span className="text-[10px] font-bold uppercase tracking-widest text-red-700 bg-red-50 border border-red-200 rounded px-1.5 py-0.5">
                                Akut
                              </span>
                            )}
                            <span className="text-sm font-semibold text-[#1A1F1C]">
                              {HANDOVER_REASON_LABEL[h.reason] ?? h.reason}
                            </span>
                          </div>
                          <div className="text-xs text-[#6B7569] space-y-0.5">
                            <div>
                              <span className="font-medium text-[#1A1F1C]">{h.outgoing_name}</span>
                              {' → '}
                              <span className="font-medium text-[#1A1F1C]">{h.incoming_name ?? 'Ikke specificeret'}</span>
                            </div>
                            <div>Af {h.created_by_name} · {fmt(h.created_at)}</div>
                            {h.completed_at && (
                              <div>Afsluttet {fmt(h.completed_at)}</div>
                            )}
                            {h.session_logs_transferred && (
                              <div className="text-[#1C3829]">Sessionslogs overført</div>
                            )}
                          </div>
                          {h.handover_note && (
                            <p className="mt-2 text-xs text-[#6B7569] italic border-l-2 border-[#E0DAD0] pl-2">
                              {h.handover_note}
                            </p>
                          )}
                        </div>
                        <Badge variant={HANDOVER_STATUS_BADGE[h.status]}>
                          {HANDOVER_STATUS_LABEL[h.status]}
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Session logs */}
            <div>
              <SectionHeader
                title="Sessionslogs"
                description={`${logsRes.count ?? 0} sessioner i alt`}
              />
              <CaseSessionLogsClient
                logs={(logsRes.data ?? []).map((l: any) => ({
                  id: l.id,
                  session_date: l.session_date,
                  duration_minutes: l.duration_minutes,
                  observations: l.observations,
                  citizen_mood_tone: l.citizen_mood_tone,
                  follow_up_needed: l.follow_up_needed,
                  follow_up_reason: l.follow_up_reason,
                  status: l.status,
                  professional_name: logProfileMap[l.professional_id] ?? 'Ukendt',
                } satisfies CaseSessionLog))}
              />
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
                  {/* Case-specific contact (set when admin created the case) */}
                  {caseDetailRes.data?.intake_contact_name && (
                    <div className="text-xs text-[#1A1F1C] font-medium">{caseDetailRes.data.intake_contact_name}</div>
                  )}
                  {caseDetailRes.data?.intake_contact_email && (
                    <a href={`mailto:${caseDetailRes.data.intake_contact_email}`} className="text-xs text-[#1C3829] hover:underline block">
                      {caseDetailRes.data.intake_contact_email}
                    </a>
                  )}
                  {/* Fallback to municipality-level contact */}
                  {!caseDetailRes.data?.intake_contact_name && muniRes.data.sagsbehandler_name && (
                    <div className="text-xs text-[#6B7569]">{muniRes.data.sagsbehandler_name}</div>
                  )}
                  {!caseDetailRes.data?.intake_contact_email && muniRes.data.sagsbehandler_email && (
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

            {/* Case documents — admin only */}
            <Card>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-3">Sagsdokumenter</div>
              <CaseDocumentsClient caseId={id} />
            </Card>

            {/* Dynamic admin actions */}
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
