import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PageHeader, ContentContainer, SectionHeader } from '@/components/layout/page-header'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

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

export default async function DashboardCasePage({ params }: PageProps) {
  const { id } = await params
  const db = await createClient()
  const { data: { user } } = await db.auth.getUser()
  if (!user) redirect('/login')

  const { data: caseData } = await db
    .from('v_cases_with_professional')
    .select('*')
    .eq('id', id)
    .single()

  if (!caseData) notFound()

  if (caseData.professional_id !== user.id) notFound()

  const [muniRes, logsRes, caseDetailRes, tagsRes, problemAreasRes, goalsRes, specialWishesRes] = await Promise.all([
    db.from('municipalities').select('name, sagsbehandler_name, sagsbehandler_email, sagsbehandler_phone').eq('id', caseData.municipality_id).single(),
    db.from('session_logs')
      .select('id, session_date, duration_minutes, observations, follow_up_needed, status')
      .eq('case_id', id)
      .eq('professional_id', user.id)
      .order('session_date', { ascending: false })
      .limit(10),
    db.from('cases').select('citizen_gender, citizen_notes').eq('id', id).single(),
    db.from('v_case_tags').select('problem_area_codes, goal_codes, special_wish_codes').eq('case_id', id).single(),
    db.from('problem_areas').select('code, label_da'),
    db.from('goals_lookup').select('code, label_da'),
    db.from('special_wishes_lookup').select('code, label_da'),
  ])

  const labelMap = (rows: { code: string; label_da: string }[] | null) =>
    Object.fromEntries((rows ?? []).map(r => [r.code, r.label_da]))
  const problemAreaLabels = labelMap(problemAreasRes.data)
  const goalLabels = labelMap(goalsRes.data)
  const specialWishLabels = labelMap(specialWishesRes.data)

  return (
    <div>
      <PageHeader
        label="Sag"
        title={`Borger ${caseData.citizen_initials}`}
        subtitle={`${caseData.citizen_age_range} · ${muniRes.data?.name ?? ''}`}
        breadcrumb={[
          { label: 'Mine sager', href: '/dashboard/cases' },
          { label: `Borger ${caseData.citizen_initials}` },
        ]}
        actions={
          <Badge variant="green" dot>Aktiv</Badge>
        }
      />

      <ContentContainer>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
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

            <div>
              <SectionHeader
                title="Sessionslogs"
                description={`${logsRes.data?.length ?? 0} af dine seneste sessioner`}
                actions={
                  <Link href={`/dashboard/session-logs?case_id=${id}`} className="text-xs font-semibold text-[#1C3829] hover:underline">
                    Se alle →
                  </Link>
                }
              />
              {(logsRes.data?.length ?? 0) === 0 ? (
                <Card className="text-center py-10">
                  <p className="text-sm text-[#6B7569] mb-3">Ingen sessionslogs endnu</p>
                  <Link href="/dashboard/session-logs" className="text-sm font-semibold text-[#1C3829] hover:underline">
                    Opret første sessionslog →
                  </Link>
                </Card>
              ) : (
                <div className="space-y-2">
                  {logsRes.data?.map(log => (
                    <Card key={log.id} className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex flex-col items-start">
                          <span className="text-sm font-medium text-[#1A1F1C]">
                            {new Intl.DateTimeFormat('da-DK', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(log.session_date))}
                          </span>
                          {log.observations && (
                            <span className="text-xs text-[#6B7569] truncate max-w-xs">{log.observations}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {log.follow_up_needed && <Badge variant="amber">Opfølgning</Badge>}
                        {log.duration_minutes && (
                          <span className="text-xs text-[#6B7569]">{log.duration_minutes} min.</span>
                        )}
                        <Badge variant={log.status === 'FINAL' ? 'green' : 'default'}>
                          {log.status === 'FINAL' ? 'Afsluttet' : 'Kladde'}
                        </Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <Card>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-3">Handlinger</div>
              <div className="space-y-2">
                <Link href={`/dashboard/session-logs?case_id=${id}`} className="flex items-center justify-between w-full h-10 px-4 bg-[#1C3829] text-[#F6F3EE] rounded-xl text-sm font-semibold hover:bg-[#2D5840] transition-colors">
                  <span>Ny sessionslog</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <line x1="12" y1="5" x2="12" y2="19" />
                    <line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                </Link>
                <Link href={`/dashboard/hours?case_id=${id}`} className="flex items-center justify-between w-full h-10 px-4 bg-white border border-[#E0DAD0] text-[#1C3829] rounded-xl text-sm font-semibold hover:bg-[#EEF4F0] transition-colors">
                  <span>Registrer timer</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </Link>
              </div>
            </Card>

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
                  {muniRes.data.sagsbehandler_phone && (
                    <a href={`tel:${muniRes.data.sagsbehandler_phone}`} className="text-xs text-[#1C3829] hover:underline block">
                      {muniRes.data.sagsbehandler_phone}
                    </a>
                  )}
                </div>
              </Card>
            )}
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
