'use client'

// This page needs useState — use client is required for the form.
// Data fetching is done client-side via fetch().
import { useEffect, useState, useTransition } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const REPORT_TYPE_LABEL: Record<string, string> = {
  MONTHLY: 'Kort månedlig status',
  EXTENDED: 'Udvidet statusrapport',
  FINAL: 'Afsluttende statusrapport',
}

const STATUS_LABEL: Record<string, string> = {
  PENDING: 'Afventer',
  ACKNOWLEDGED: 'Bekræftet',
  SUBMITTED: 'Indsendt',
  REVIEWED: 'Gennemset',
}

interface RequestData {
  id: string
  case_id: string
  report_type: string
  deadline: string
  promised_date: string | null
  status: string
  message: string | null
  created_at: string
  cases: { citizen_initials: string; citizen_age_range: string }
  status_reports: StatusReport[]
}

interface StatusReport {
  id: string
  period_start: string | null
  period_end: string | null
  everyday_situation: string | null
  work_focus: string | null
  progress_resources: string | null
  challenges: string | null
  concern_level: string | null
  concern_text: string | null
  collaboration: string | null
  recommendation: string | null
  overall_assessment: string | null
  overall_assessment_note: string | null
  submitted_at: string | null
}

type FormState = {
  promised_date: string
  period_start: string
  period_end: string
  everyday_situation: string
  work_focus: string
  progress_resources: string
  challenges: string
  concern_level: string
  concern_text: string
  collaboration: string
  recommendation: string
  overall_assessment: string
  overall_assessment_note: string
}

export default function StatusReportDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [data, setData] = useState<RequestData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [acknowledging, startAck] = useTransition()
  const [submitting, startSubmit] = useTransition()
  const [ackError, setAckError] = useState<string | null>(null)
  const [submitError, setSubmitError] = useState<string | null>(null)

  const [form, setForm] = useState<FormState>({
    promised_date: '',
    period_start: '',
    period_end: '',
    everyday_situation: '',
    work_focus: '',
    progress_resources: '',
    challenges: '',
    concern_level: 'NONE',
    concern_text: '',
    collaboration: '',
    recommendation: '',
    overall_assessment: 'ON_TRACK',
    overall_assessment_note: '',
  })

  useEffect(() => {
    fetch(`/api/status-report-requests/${id}`)
      .then(r => r.json())
      .then(json => {
        if (json.error) { setError(json.error); setLoading(false); return }
        setData(json.data)
        const report = json.data.status_reports?.[0]
        if (report) {
          setForm(f => ({
            ...f,
            period_start: report.period_start ?? '',
            period_end: report.period_end ?? '',
            everyday_situation: report.everyday_situation ?? '',
            work_focus: report.work_focus ?? '',
            progress_resources: report.progress_resources ?? '',
            challenges: report.challenges ?? '',
            concern_level: report.concern_level ?? 'NONE',
            concern_text: report.concern_text ?? '',
            collaboration: report.collaboration ?? '',
            recommendation: report.recommendation ?? '',
            overall_assessment: report.overall_assessment ?? 'ON_TRACK',
            overall_assessment_note: report.overall_assessment_note ?? '',
          }))
        }
        if (json.data.promised_date) {
          setForm(f => ({ ...f, promised_date: json.data.promised_date }))
        }
        setLoading(false)
      })
      .catch(() => { setError('Kunne ikke hente rapport'); setLoading(false) })
  }, [id])

  function set(key: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setForm(f => ({ ...f, [key]: e.target.value }))
    }
  }

  function handleAcknowledge(e: React.FormEvent) {
    e.preventDefault()
    setAckError(null)
    startAck(async () => {
      const res = await fetch(`/api/status-report-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'acknowledge', promised_date: form.promised_date }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) { setAckError(json.error ?? 'Noget gik galt'); return }
      setData(d => d ? { ...d, status: 'ACKNOWLEDGED', promised_date: form.promised_date } : d)
    })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitError(null)
    startSubmit(async () => {
      const res = await fetch(`/api/status-report-requests/${id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          period_start: form.period_start || null,
          period_end: form.period_end || null,
          everyday_situation: form.everyday_situation,
          work_focus: form.work_focus,
          progress_resources: form.progress_resources,
          challenges: form.challenges,
          concern_level: form.concern_level,
          concern_text: form.concern_text || null,
          collaboration: form.collaboration,
          recommendation: form.recommendation,
          overall_assessment: form.overall_assessment,
          overall_assessment_note: form.overall_assessment_note || null,
        }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) { setSubmitError(json.error ?? 'Noget gik galt'); return }
      router.push('/dashboard/status-reports')
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F6F3EE] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#1C3829] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-[#F6F3EE] flex flex-col items-center justify-center gap-4">
        <p className="text-sm text-[#6B7569]">{error ?? 'Ikke fundet'}</p>
        <Link href="/dashboard/status-reports" className="text-xs text-[#1C3829] underline">Tilbage til oversigt</Link>
      </div>
    )
  }

  const deadlineDate = new Date(data.deadline)
  const report = data.status_reports?.[0] ?? null
  const isSubmitted = data.status === 'SUBMITTED' || data.status === 'REVIEWED'
  const isAcknowledged = data.status === 'ACKNOWLEDGED'
  const isPending = data.status === 'PENDING'

  const today = new Date().toISOString().slice(0, 10)
  const isOverdue = data.deadline < today && !isSubmitted

  return (
    <div className="min-h-screen bg-[#F6F3EE]">
      {/* Compact header */}
      <div className="bg-[#1C3829] px-5 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-2 mb-3">
            <Link href="/dashboard/status-reports" className="text-white/60 hover:text-white text-xs transition-colors">
              Statusrapporter
            </Link>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-white/40">
              <polyline points="9 18 15 12 9 6" />
            </svg>
            <span className="text-white/40 text-xs">Borger {data.cases?.citizen_initials}</span>
          </div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="font-serif text-xl text-white font-semibold leading-snug">
                {REPORT_TYPE_LABEL[data.report_type] ?? data.report_type}
              </h1>
              <p className="text-white/60 text-sm mt-0.5">
                Borger {data.cases?.citizen_initials} · {data.cases?.citizen_age_range}
                {' · '}Frist {deadlineDate.toLocaleDateString('da-DK', { day: 'numeric', month: 'long' })}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0 mt-0.5">
              {isOverdue && <Badge variant="red">Forfalden</Badge>}
              <Badge variant={data.status === 'SUBMITTED' ? 'green' : data.status === 'ACKNOWLEDGED' ? 'brand' : data.status === 'REVIEWED' ? 'default' : 'amber'} dot>
                {STATUS_LABEL[data.status] ?? data.status}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        {/* Context message from admin */}
        {data.message && (
          <Card>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-1.5">Besked fra Kursskifte</div>
            <p className="text-sm text-[#1A1F1C] whitespace-pre-wrap">{data.message}</p>
          </Card>
        )}

        {/* Step 1: Acknowledge — only if still PENDING */}
        {isPending && (
          <Card>
            <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-3">Trin 1 — Bekræft modtagelse</div>
            <p className="text-sm text-[#6B7569] mb-4">
              Angiv hvornår du forventer at have rapporten klar. Du kan derefter udfylde skabelonen nedenfor.
            </p>
            <form onSubmit={handleAcknowledge} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-[#6B7569] block mb-1">
                  Forventet afleveringsdato <span className="text-red-500">*</span>
                </label>
                <input
                  required
                  type="date"
                  min={today}
                  value={form.promised_date}
                  onChange={set('promised_date')}
                  className="px-3 py-2 rounded-xl border border-[#E0DAD0] text-sm focus:outline-none focus:border-[#1C3829] bg-white"
                />
              </div>
              {ackError && <p className="text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2">{ackError}</p>}
              <Button type="submit" variant="primary" size="sm" loading={acknowledging}>
                Bekræft anmodning
              </Button>
            </form>
          </Card>
        )}

        {/* Acknowledged note */}
        {isAcknowledged && data.promised_date && (
          <div className="flex items-center gap-2 px-4 py-3 bg-[#EEF4F0] rounded-xl">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1C3829" strokeWidth="2" strokeLinecap="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span className="text-xs text-[#1C3829] font-medium">
              Bekræftet — du har lovet aflevering senest {new Date(data.promised_date).toLocaleDateString('da-DK', { day: 'numeric', month: 'long' })}
            </span>
          </div>
        )}

        {/* Step 2: Fill in report — available when acknowledged or pending (to draft) */}
        {!isSubmitted && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] px-1">
              {isPending ? 'Skabelon (du kan begynde at udfylde)' : 'Trin 2 — Udfyld statusrapport'}
            </div>

            {/* Period */}
            <Card>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-3">Periode</div>
              <div className="flex flex-wrap gap-3">
                <div>
                  <label className="text-xs font-medium text-[#6B7569] block mb-1">Fra</label>
                  <input type="date" value={form.period_start} onChange={set('period_start')}
                    className="px-3 py-2 rounded-xl border border-[#E0DAD0] text-sm focus:outline-none focus:border-[#1C3829] bg-white" />
                </div>
                <div>
                  <label className="text-xs font-medium text-[#6B7569] block mb-1">Til</label>
                  <input type="date" value={form.period_end} onChange={set('period_end')}
                    className="px-3 py-2 rounded-xl border border-[#E0DAD0] text-sm focus:outline-none focus:border-[#1C3829] bg-white" />
                </div>
              </div>
            </Card>

            {/* Template fields */}
            {[
              {
                key: 'everyday_situation' as keyof FormState,
                label: 'Borgerens hverdagssituation og trivsel',
                placeholder: 'Beskriv borgerens aktuelle hverdagssituation, trivsel og sociale funktionsniveau.',
                required: true,
              },
              {
                key: 'work_focus' as keyof FormState,
                label: 'Hvad har I arbejdet med i perioden?',
                placeholder: 'Hvilke konkrete aktiviteter, mål og indsatser har I haft fokus på?',
                required: true,
              },
              {
                key: 'progress_resources' as keyof FormState,
                label: 'Konkrete fremskridt og borgerens ressourcer',
                placeholder: 'Beskriv synlige fremskridt — store eller små. Hvilke styrker og ressourcer har borgeren vist?',
                required: true,
              },
              {
                key: 'challenges' as keyof FormState,
                label: 'Udfordringer og barrierer i perioden',
                placeholder: 'Hvad har været svært? Hvad har I måttet justere eller udskyde?',
                required: true,
              },
              {
                key: 'collaboration' as keyof FormState,
                label: 'Samarbejde med borger og netværk',
                placeholder: 'Beskriv samarbejdets kvalitet — borgerens motivation, netværkets rolle, eventuelle konflikter.',
                required: true,
              },
              {
                key: 'recommendation' as keyof FormState,
                label: 'Faglig anbefaling fremadrettet',
                placeholder: 'Hvad anbefaler du for det videre forløb? Er der behov for justering, intensivering eller afslutning?',
                required: true,
              },
            ].map(field => (
              <Card key={field.key}>
                <label className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] block mb-2">
                  {field.label} {field.required && <span className="text-red-400">*</span>}
                </label>
                <textarea
                  required={field.required}
                  rows={4}
                  value={form[field.key]}
                  onChange={set(field.key)}
                  placeholder={field.placeholder}
                  className="w-full px-3 py-2 rounded-xl border border-[#E0DAD0] text-sm focus:outline-none focus:border-[#1C3829] resize-none bg-[#FAFAF8] placeholder:text-[#C8C0B0]"
                />
              </Card>
            ))}

            {/* Concern level */}
            <Card>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-3">Bekymringsniveau</div>
              <div className="space-y-2 mb-3">
                {[
                  { value: 'NONE', label: 'Ingen bekymring', description: 'Forløbet kører planmæssigt og borger trives.' },
                  { value: 'MINOR', label: 'Lettere bekymring', description: 'Noget giver anledning til ekstra opmærksomhed, men kræver ikke akut handling.' },
                  { value: 'CONCERN', label: 'Bekymring der kræver opmærksomhed', description: 'Situationen kræver handling. Husk din personlige underretningspligt (barnets lov §133) ved bekymring for barnets sikkerhed.' },
                ].map(opt => (
                  <label key={opt.value} className={[
                    'flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors',
                    form.concern_level === opt.value ? 'border-[#1C3829] bg-[#EEF4F0]' : 'border-[#E0DAD0] hover:border-[#C8C0B0]',
                  ].join(' ')}>
                    <input
                      type="radio"
                      name="concern_level"
                      value={opt.value}
                      checked={form.concern_level === opt.value}
                      onChange={set('concern_level')}
                      className="mt-0.5 accent-[#1C3829]"
                    />
                    <div>
                      <div className="text-sm font-medium text-[#1A1F1C]">{opt.label}</div>
                      <div className="text-xs text-[#6B7569] mt-0.5">{opt.description}</div>
                    </div>
                  </label>
                ))}
              </div>
              {form.concern_level !== 'NONE' && (
                <div>
                  <label className="text-xs font-medium text-[#6B7569] block mb-1">Uddyb bekymringen <span className="text-red-400">*</span></label>
                  <textarea
                    required
                    rows={3}
                    value={form.concern_text}
                    onChange={set('concern_text')}
                    placeholder="Beskriv hvad bekymringen drejer sig om, og hvad du allerede har gjort eller planlægger at gøre."
                    className="w-full px-3 py-2 rounded-xl border border-[#E0DAD0] text-sm focus:outline-none focus:border-[#1C3829] resize-none bg-[#FAFAF8] placeholder:text-[#C8C0B0]"
                  />
                </div>
              )}
            </Card>

            {/* Overall assessment */}
            <Card>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-3">Samlet faglig vurdering</div>
              <div className="space-y-2 mb-4">
                {[
                  {
                    value: 'ON_TRACK',
                    label: 'Forløbet kører planmæssigt',
                    description: 'Borgeren er stabil og udvikler sig som forventet. Mål følges, samarbejdet fungerer og der er ikke behov for at ændre indsatsen på nuværende tidspunkt.',
                  },
                  {
                    value: 'ADJUSTING',
                    label: 'Forløbet justeres',
                    description: 'Noget i indsatsen skal ændres for at det fortsat har effekt. Det kan dreje sig om hyppighed, fokus, metode, mål eller samarbejdsform. Beskriv hvad og hvorfor nedenfor.',
                  },
                  {
                    value: 'RECOMMEND_CLOSE',
                    label: 'Anbefales afsluttet',
                    description: 'Borgeren har nået sine mål og er klar til at stå på egne ben — eller forløbet har ikke den ønskede virkning og en anden indsats vil være mere hensigtsmæssig. Angiv begrundelse nedenfor.',
                  },
                ].map(opt => (
                  <label key={opt.value} className={[
                    'flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors',
                    form.overall_assessment === opt.value ? 'border-[#1C3829] bg-[#EEF4F0]' : 'border-[#E0DAD0] hover:border-[#C8C0B0]',
                  ].join(' ')}>
                    <input
                      type="radio"
                      name="overall_assessment"
                      value={opt.value}
                      checked={form.overall_assessment === opt.value}
                      onChange={set('overall_assessment')}
                      className="mt-0.5 accent-[#1C3829]"
                    />
                    <div>
                      <div className="text-sm font-medium text-[#1A1F1C]">{opt.label}</div>
                      <div className="text-xs text-[#6B7569] mt-0.5 leading-relaxed">{opt.description}</div>
                    </div>
                  </label>
                ))}
              </div>
              <div>
                <label className="text-xs font-medium text-[#6B7569] block mb-1">
                  {form.overall_assessment === 'ON_TRACK'
                    ? 'Uddyb vurderingen (valgfrit)'
                    : form.overall_assessment === 'ADJUSTING'
                    ? <>Hvad justeres og hvorfor? <span className="text-red-400">*</span></>
                    : <>Begrundelse for afslutning <span className="text-red-400">*</span></>}
                </label>
                <textarea
                  required={form.overall_assessment !== 'ON_TRACK'}
                  rows={3}
                  value={form.overall_assessment_note}
                  onChange={set('overall_assessment_note')}
                  placeholder={
                    form.overall_assessment === 'ON_TRACK'
                      ? 'Tilføj evt. en kort kommentar til din vurdering — hvad er særligt positivt eller hvad vil du holde øje med fremover?'
                      : form.overall_assessment === 'ADJUSTING'
                      ? 'Beskriv hvad der skal justeres, hvorfor det er nødvendigt, og hvad du planlægger at gøre anderledes i den kommende periode.'
                      : 'Beskriv hvorfor forløbet anbefales afsluttet. Er borgeren klar til at stå alene, eller er en anden indsats mere hensigtsmæssig? Hvad er næste skridt?'
                  }
                  className="w-full px-3 py-2 rounded-xl border border-[#E0DAD0] text-sm focus:outline-none focus:border-[#1C3829] resize-none bg-[#FAFAF8] placeholder:text-[#C8C0B0]"
                />
              </div>
            </Card>

            {submitError && (
              <p className="text-xs text-red-600 bg-red-50 rounded-xl px-3 py-2">{submitError}</p>
            )}

            {isPending && (
              <p className="text-xs text-[#9B9589] px-1">
                Bekræft anmodningen ovenfor inden du indsender rapporten.
              </p>
            )}

            <div className="flex gap-2 pb-8">
              <Button type="submit" variant="primary" size="sm" loading={submitting} disabled={isPending}>
                Indsend rapport
              </Button>
              <Link href="/dashboard/status-reports">
                <Button type="button" variant="ghost" size="sm">Tilbage</Button>
              </Link>
            </div>
          </form>
        )}

        {/* Submitted — read-only view */}
        {isSubmitted && report && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#6B7569]">Indsendt rapport</span>
              <div className="flex-1 h-px bg-[#E0DAD0]" />
            </div>

            <Card>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-1">Periode</div>
              <div className="text-sm text-[#1A1F1C]">
                {report.period_start && report.period_end
                  ? `${new Date(report.period_start).toLocaleDateString('da-DK', { day: 'numeric', month: 'short' })} – ${new Date(report.period_end).toLocaleDateString('da-DK', { day: 'numeric', month: 'short', year: 'numeric' })}`
                  : '—'}
              </div>
            </Card>

            {[
              { label: 'Borgerens hverdagssituation og trivsel', value: report.everyday_situation },
              { label: 'Hvad har I arbejdet med?', value: report.work_focus },
              { label: 'Konkrete fremskridt og ressourcer', value: report.progress_resources },
              { label: 'Udfordringer i perioden', value: report.challenges },
              { label: 'Bekymring — uddybning', value: report.concern_text, hide: !report.concern_text },
              { label: 'Samarbejde med borger og netværk', value: report.collaboration },
              { label: 'Faglig anbefaling fremadrettet', value: report.recommendation },
              { label: 'Uddybning af samlet vurdering', value: report.overall_assessment_note, hide: !report.overall_assessment_note },
            ].filter(f => !('hide' in f && f.hide) && f.value).map(field => (
              <Card key={field.label}>
                <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-2">{field.label}</div>
                <p className="text-sm text-[#1A1F1C] whitespace-pre-wrap leading-relaxed">{field.value}</p>
              </Card>
            ))}

            <p className="text-xs text-[#9B9589] text-right pb-8">
              Indsendt {report.submitted_at ? new Date(report.submitted_at).toLocaleString('da-DK', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
