'use client'

import { useState, useTransition, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/empty-state'
import { SectionHeader } from '@/components/layout/page-header'
import type { AdminCase, MunicipalityOption, LookupOption } from './page'

const STATUS_LABEL: Record<string, string> = {
  OPEN: 'Åben', MATCHED: 'Matchet', PROPOSED: 'Forslag sendt', ACTIVE: 'Aktiv', COMPLETED: 'Afsluttet', ARCHIVED: 'Arkiveret',
}

const STATUS_BADGE: Record<string, 'amber' | 'brand' | 'green' | 'default'> = {
  OPEN: 'amber', MATCHED: 'brand', PROPOSED: 'amber', ACTIVE: 'green', COMPLETED: 'default', ARCHIVED: 'default',
}

const COMPLEXITY_LABEL: Record<string, string> = {
  LOW: 'Lav', MEDIUM: 'Mellem', HIGH: 'Høj', CRITICAL: 'Kritisk',
}

const COMPLEXITY_BADGE: Record<string, 'green' | 'amber' | 'red' | 'default'> = {
  LOW: 'green', MEDIUM: 'amber', HIGH: 'red', CRITICAL: 'red',
}

const AGE_OPTIONS = ['0-5', '6-12', '13-18', '18+'] as const
const COMPLEXITY_OPTIONS = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const
const GENDER_OPTIONS = ['MALE', 'FEMALE', 'OTHER'] as const
const GENDER_LABEL: Record<string, string> = { MALE: 'Dreng/mand', FEMALE: 'Pige/kvinde', OTHER: 'Andet' }
const PROF_GENDER_OPTIONS = ['MALE', 'FEMALE', 'NO_PREF'] as const
const PROF_GENDER_LABEL: Record<string, string> = { MALE: 'Mand', FEMALE: 'Kvinde', NO_PREF: 'Ingen præference' }
const TRANSPORT_OPTIONS = ['JA', 'NEJ'] as const
const LEGAL_BASIS_OPTIONS = [
  { value: 'BARNETS_LOV_32', label: '§32 barnets lov', note: 'Børn 0–17 år' },
  { value: 'SEL_76', label: '§76 serviceloven', note: 'Unge 18–22 år (efterværn)' },
  { value: 'SEL_85', label: '§85 serviceloven', note: 'Voksne 18+' },
  { value: 'SEL_99', label: '§99 serviceloven', note: 'Sociale mødesteder' },
] as const
const LANGUAGE_OPTIONS = ['Dansk', 'Engelsk', 'Arabisk', 'Tyrkisk', 'Urdu', 'Somalisk', 'Dari/Pashto', 'Bosnisk/Serbisk', 'Polsk', 'Rumænsk'] as const
const DURATION_OPTIONS = [
  { value: '3', label: '3 mdr.' },
  { value: '6', label: '6 mdr.' },
  { value: '12', label: '1 år' },
  { value: '24', label: '2 år' },
  { value: '36', label: '3+ år' },
] as const

type FilterKey = 'all' | 'OPEN' | 'MATCHED' | 'ACTIVE' | 'COMPLETED'

type NewCaseForm = {
  // Kommuneoplysninger
  municipality_id: string
  intake_contact_name: string
  intake_contact_email: string
  intake_contact_phone: string
  // Borger
  citizen_initials: string
  citizen_name: string
  citizen_dob: string
  citizen_age_range: string
  legal_basis: string
  citizen_gender: string
  // Sagen
  complexity_level: string
  weekly_hours: string
  urgency: string
  expected_duration_months: string
  // Borgerens profil
  diagnoses: string
  daily_function: string
  citizen_interests: string
  problem_area_codes: string[]
  // Ønsker til fagperson
  goal_codes: string[]
  special_wish_codes: string[]
  preferred_prof_gender: string
  required_languages: string[]
  transport_needs: string
  geographical_area: string
  // Interne noter
  citizen_notes: string
}

const EMPTY_FORM: NewCaseForm = {
  municipality_id: '',
  intake_contact_name: '',
  intake_contact_email: '',
  intake_contact_phone: '',
  citizen_initials: '',
  citizen_name: '',
  citizen_dob: '',
  citizen_age_range: '13-18',
  legal_basis: '',
  citizen_gender: '',
  complexity_level: 'MEDIUM',
  weekly_hours: '5',
  urgency: 'NORMAL',
  expected_duration_months: '',
  diagnoses: '',
  daily_function: '',
  citizen_interests: '',
  problem_area_codes: [],
  goal_codes: [],
  special_wish_codes: [],
  preferred_prof_gender: '',
  required_languages: [],
  transport_needs: '',
  geographical_area: '',
  citizen_notes: '',
}

function toggleInArray(arr: string[], value: string): string[] {
  return arr.includes(value) ? arr.filter(v => v !== value) : [...arr, value]
}

const inputClass =
  'w-full border border-[#E0DAD0] rounded-xl px-4 py-2.5 text-sm text-[#1A1F1C] bg-[#F6F3EE] placeholder:text-[#C8C0B0] focus:outline-none focus:border-[#1C3829] focus:bg-white transition-colors'

const labelClass = 'block text-xs font-semibold uppercase tracking-widest text-[#6B7569] mb-2'

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#6B7569]">{title}</span>
        <div className="flex-1 h-px bg-[#E0DAD0]" />
      </div>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  )
}

export function AdminCasesClient({
  initialCases,
  municipalities,
  lookups,
}: {
  initialCases: AdminCase[]
  municipalities: MunicipalityOption[]
  lookups: { problemAreas: LookupOption[]; goals: LookupOption[]; specialWishes: LookupOption[] }
}) {
  const router = useRouter()
  const [filter, setFilter] = useState<FilterKey>('all')
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [form, setForm] = useState<NewCaseForm>(EMPTY_FORM)
  const [saving, startSave] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const counts = useMemo(() => ({
    all: initialCases.filter(c => c.status !== 'ARCHIVED').length,
    OPEN: initialCases.filter(c => c.status === 'OPEN').length,
    MATCHED: initialCases.filter(c => c.status === 'MATCHED').length,
    ACTIVE: initialCases.filter(c => c.status === 'ACTIVE').length,
    COMPLETED: initialCases.filter(c => c.status === 'COMPLETED').length,
  }), [initialCases])

  const filtered = useMemo(() => {
    if (filter === 'all') return initialCases.filter(c => c.status !== 'ARCHIVED')
    return initialCases.filter(c => c.status === filter)
  }, [initialCases, filter])

  function field(key: keyof NewCaseForm) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm(f => ({ ...f, [key]: e.target.value }))
  }

  function openNewCase() {
    setForm({ ...EMPTY_FORM, municipality_id: municipalities[0]?.id ?? '' })
    setError(null)
    setDrawerOpen(true)
  }

  function closeDrawer() {
    setDrawerOpen(false)
    setError(null)
  }

  function handleCreate() {
    const initials = form.citizen_initials.trim().toUpperCase()
    if (initials.length !== 2) { setError('Initialer skal være præcis 2 bogstaver'); return }
    if (!form.municipality_id) { setError('Vælg en kommune'); return }

    startSave(async () => {
      setError(null)
      const res = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          municipality_id: form.municipality_id,
          citizen_initials: initials,
          citizen_age_range: form.citizen_age_range,
          citizen_gender: form.citizen_gender || undefined,
          weekly_hours: Number(form.weekly_hours),
          complexity_level: form.complexity_level,
          urgency: form.urgency,
          intake_contact_name: form.intake_contact_name || undefined,
          intake_contact_email: form.intake_contact_email || undefined,
          citizen_notes: form.citizen_notes || undefined,
          problem_area_codes: form.problem_area_codes,
          goal_codes: form.goal_codes,
          special_wish_codes: form.special_wish_codes,
          intake_contact_phone: form.intake_contact_phone || undefined,
          citizen_name: form.citizen_name || undefined,
          citizen_dob: form.citizen_dob || undefined,
          legal_basis: form.legal_basis || undefined,
          expected_duration_months: form.expected_duration_months ? Number(form.expected_duration_months) : undefined,
          diagnoses: form.diagnoses || undefined,
          daily_function: form.daily_function || undefined,
          citizen_interests: form.citizen_interests || undefined,
          preferred_prof_gender: form.preferred_prof_gender || undefined,
          required_languages: form.required_languages.length > 0 ? form.required_languages : undefined,
          transport_needs: form.transport_needs || undefined,
          geographical_area: form.geographical_area || undefined,
        }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError((d as { error?: string }).error ?? 'Noget gik galt')
        return
      }
      closeDrawer()
      router.refresh()
    })
  }

  const tabs: { key: FilterKey; label: string }[] = [
    { key: 'all', label: 'Alle' },
    { key: 'OPEN', label: 'Åbne' },
    { key: 'MATCHED', label: 'Matchet' },
    { key: 'ACTIVE', label: 'Aktive' },
    { key: 'COMPLETED', label: 'Afsluttet' },
  ]

  return (
    <>
      <SectionHeader
        title={`${counts.all} sager`}
        description={counts.OPEN > 0 ? `${counts.OPEN} åbne sager afventer matching` : undefined}
        actions={
          <Button variant="primary" size="sm" icon={<PlusIcon />} onClick={openNewCase}>
            Ny sag
          </Button>
        }
      />

      {/* Filter tabs */}
      <div className="flex gap-1 mb-5 bg-[#F6F3EE] rounded-xl p-1 overflow-x-auto scrollbar-none">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={[
              'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
              filter === tab.key
                ? 'bg-white text-[#1A1F1C] shadow-sm'
                : 'text-[#6B7569] hover:text-[#1A1F1C]',
            ].join(' ')}
          >
            {tab.label}
            {counts[tab.key] > 0 && (
              <span className={`ml-1.5 tabular-nums ${filter === tab.key ? 'text-[#1C3829]' : 'text-[#C8C0B0]'}`}>
                {counts[tab.key]}
              </span>
            )}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<CaseIcon />}
          title="Ingen sager fundet"
          description={filter === 'all' ? 'Opret den første sag for at komme i gang' : undefined}
          action={filter === 'all' ? (
            <Button variant="primary" icon={<PlusIcon />} onClick={openNewCase}>
              Opret sag
            </Button>
          ) : undefined}
        />
      ) : (
        <div className="space-y-3">
          {filtered.map(c => (
            <Link key={c.id} href={`/admin/cases/${c.id}`}>
              <Card
                hover
                className={[
                  'flex items-center justify-between gap-4',
                  c.urgency === 'AKUT' ? 'border-red-200 bg-[#FEF2F2]' : '',
                ].join(' ')}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={[
                    'w-9 h-9 rounded-xl flex items-center justify-center shrink-0',
                    c.urgency === 'AKUT' ? 'bg-red-100' : 'bg-[#FBF3E1]',
                  ].join(' ')}>
                    <span className={`text-sm font-bold ${c.urgency === 'AKUT' ? 'text-red-700' : 'text-[#92660A]'}`}>
                      {c.citizen_initials}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium text-[#1A1F1C] text-sm flex items-center gap-2">
                      Borger {c.citizen_initials} · {c.citizen_age_range}
                      {c.urgency === 'AKUT' && <span className="text-[10px] font-bold uppercase tracking-widest text-red-700 bg-red-100 border border-red-200 rounded px-1.5 py-0.5">🔴 Akut</span>}
                      {c.urgency === 'HURTIG' && <span className="text-[10px] font-bold uppercase tracking-widest text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">🟡 Hurtig</span>}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <Badge variant={COMPLEXITY_BADGE[c.complexity_level] ?? 'default'}>
                        {COMPLEXITY_LABEL[c.complexity_level] ?? c.complexity_level}
                      </Badge>
                      <span className="text-xs text-[#6B7569]">{c.weekly_hours} t/uge</span>
                      <span className="text-xs text-[#C8C0B0]">{c.municipality_name}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant={STATUS_BADGE[c.status] ?? 'default'} dot>
                    {STATUS_LABEL[c.status] ?? c.status}
                  </Badge>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C8C0B0" strokeWidth="1.75" strokeLinecap="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Backdrop */}
      <div
        className={[
          'fixed inset-0 bg-[#1A1F1C]/50 z-40 transition-opacity duration-300',
          drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none',
        ].join(' ')}
        onClick={closeDrawer}
        aria-hidden="true"
      />

      {/* New case drawer — wide panel */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-label="Opret ny sag"
        className={[
          'fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-white shadow-xl',
          'flex flex-col transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
          drawerOpen ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 sm:px-8 sm:py-5 border-b border-[#E0DAD0] shrink-0">
          <div>
            <h2 className="font-serif text-xl font-semibold text-[#1A1F1C]">Opret ny sag</h2>
            <p className="text-xs text-[#6B7569] mt-0.5">Udfyld borger- og sagsoplysninger</p>
          </div>
          <button
            type="button"
            onClick={closeDrawer}
            className="w-8 h-8 rounded-full bg-[#F6F3EE] hover:bg-[#EEF4F0] flex items-center justify-center text-[#6B7569] hover:text-[#1A1F1C] transition-colors"
            aria-label="Luk"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-8 sm:py-7 space-y-8">

          {/* ── Kommuneoplysninger ── */}
          <FormSection title="Kommuneoplysninger">
            <div>
              <label className={labelClass}>Kommune</label>
              <select value={form.municipality_id} onChange={field('municipality_id')} className={inputClass}>
                <option value="">Vælg kommune...</option>
                {municipalities.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Kommunens sagsbehandler</label>
              <div className="space-y-2">
                <input
                  type="text"
                  value={form.intake_contact_name}
                  onChange={field('intake_contact_name')}
                  placeholder="Fulde navn"
                  className={inputClass}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="email"
                    value={form.intake_contact_email}
                    onChange={field('intake_contact_email')}
                    placeholder="E-mailadresse"
                    className={inputClass}
                  />
                  <input
                    type="tel"
                    value={form.intake_contact_phone}
                    onChange={field('intake_contact_phone')}
                    placeholder="Telefon"
                    className={inputClass}
                  />
                </div>
              </div>
              <p className="text-[10px] text-[#6B7569] mt-1.5">Internt felt — vises kun i Kursskifte Administration</p>
            </div>
          </FormSection>

          {/* ── Borger ── */}
          <FormSection title="Borger">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Initialer (2 bogstaver) *</label>
                <input
                  type="text"
                  value={form.citizen_initials}
                  onChange={field('citizen_initials')}
                  maxLength={2}
                  placeholder="f.eks. AB"
                  className={`${inputClass} uppercase`}
                  autoFocus
                />
              </div>
              <div>
                <label className={labelClass}>Fulde navn</label>
                <input
                  type="text"
                  value={form.citizen_name}
                  onChange={field('citizen_name')}
                  placeholder="Borgerens fulde navn"
                  className={inputClass}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Fødselsdato</label>
                <input
                  type="date"
                  value={form.citizen_dob}
                  onChange={field('citizen_dob')}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Aldersgruppe</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {AGE_OPTIONS.map(age => (
                    <button
                      key={age}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, citizen_age_range: age }))}
                      className={[
                        'h-10 rounded-xl text-sm font-medium border transition-all',
                        form.citizen_age_range === age
                          ? 'bg-[#1C3829] text-white border-[#1C3829]'
                          : 'bg-white text-[#6B7569] border-[#E0DAD0] hover:border-[#1C3829]',
                      ].join(' ')}
                    >
                      {age}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className={labelClass}>Lovgrundlag</label>
              <div className="grid grid-cols-2 gap-2">
                {LEGAL_BASIS_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, legal_basis: f.legal_basis === opt.value ? '' : opt.value }))}
                    className={[
                      'flex flex-col items-start px-3 py-2.5 rounded-xl border transition-all text-left',
                      form.legal_basis === opt.value
                        ? 'bg-[#1C3829] text-white border-[#1C3829]'
                        : 'bg-white text-[#1A1F1C] border-[#E0DAD0] hover:border-[#1C3829]',
                    ].join(' ')}
                  >
                    <span className="text-sm font-semibold">{opt.label}</span>
                    <span className={`text-[10px] mt-0.5 ${form.legal_basis === opt.value ? 'text-white/70' : 'text-[#6B7569]'}`}>{opt.note}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={labelClass}>Køn (valgfri)</label>
              <div className="grid grid-cols-3 gap-2">
                {GENDER_OPTIONS.map(g => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, citizen_gender: f.citizen_gender === g ? '' : g }))}
                    className={[
                      'h-10 rounded-xl text-xs font-medium border transition-all',
                      form.citizen_gender === g
                        ? 'bg-[#1C3829] text-white border-[#1C3829]'
                        : 'bg-white text-[#6B7569] border-[#E0DAD0] hover:border-[#1C3829]',
                    ].join(' ')}
                  >
                    {GENDER_LABEL[g]}
                  </button>
                ))}
              </div>
            </div>
          </FormSection>

          {/* ── Sagsdetaljer ── */}
          <FormSection title="Sagsdetaljer">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Kompleksitet</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {COMPLEXITY_OPTIONS.map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, complexity_level: c }))}
                      className={[
                        'h-10 rounded-xl text-xs font-medium border transition-all',
                        form.complexity_level === c
                          ? 'bg-[#1C3829] text-white border-[#1C3829]'
                          : 'bg-white text-[#6B7569] border-[#E0DAD0] hover:border-[#1C3829]',
                      ].join(' ')}
                    >
                      {COMPLEXITY_LABEL[c]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelClass}>Ugentlige timer</label>
                <input
                  type="number"
                  min={0}
                  max={40}
                  value={form.weekly_hours}
                  onChange={field('weekly_hours')}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>Hastighed</label>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { value: 'NORMAL', label: '⚪ Normal' },
                  { value: 'HURTIG', label: '🟡 Hurtig' },
                  { value: 'AKUT', label: '🔴 Akut (24t)' },
                ] as const).map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, urgency: opt.value }))}
                    className={[
                      'h-10 rounded-xl text-xs font-semibold border transition-all',
                      form.urgency === opt.value
                        ? opt.value === 'AKUT'
                          ? 'bg-red-700 text-white border-red-700'
                          : opt.value === 'HURTIG'
                            ? 'bg-amber-500 text-white border-amber-500'
                            : 'bg-[#1C3829] text-white border-[#1C3829]'
                        : 'bg-white text-[#6B7569] border-[#E0DAD0] hover:border-[#1C3829]',
                    ].join(' ')}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {form.urgency === 'AKUT' && (
                <p className="text-xs text-red-600 mt-1.5 font-medium">Akut sager sorteres øverst og markeres med rødt i sagslisten.</p>
              )}
            </div>

            <div>
              <label className={labelClass}>Forventet varighed</label>
              <div className="flex gap-2 flex-wrap">
                {DURATION_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, expected_duration_months: f.expected_duration_months === opt.value ? '' : opt.value }))}
                    className={[
                      'px-3 h-9 rounded-xl text-xs font-medium border transition-all',
                      form.expected_duration_months === opt.value
                        ? 'bg-[#1C3829] text-white border-[#1C3829]'
                        : 'bg-white text-[#6B7569] border-[#E0DAD0] hover:border-[#1C3829]',
                    ].join(' ')}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </FormSection>

          {/* ── Borgerens profil ── */}
          <FormSection title="Borgerens profil">
            <div>
              <label className={labelClass}>Diagnoser / funktionsnedsættelse</label>
              <textarea
                value={form.diagnoses}
                onChange={field('diagnoses')}
                rows={2}
                placeholder="f.eks. ADHD, autisme, hjerneskade, kognitive vanskeligheder..."
                className={`${inputClass} resize-none`}
              />
            </div>

            <div>
              <label className={labelClass}>Daglig funktion</label>
              <textarea
                value={form.daily_function}
                onChange={field('daily_function')}
                rows={2}
                placeholder="Beskriv borgerens daglige funktionsniveau og støttebehov..."
                className={`${inputClass} resize-none`}
              />
            </div>

            <div>
              <label className={labelClass}>Interesser og ressourcer</label>
              <textarea
                value={form.citizen_interests}
                onChange={field('citizen_interests')}
                rows={2}
                placeholder="Borgerens interesser, hobbyer og stærke sider..."
                className={`${inputClass} resize-none`}
              />
            </div>

            <div>
              <label className={labelClass}>Problemområder (valgfri)</label>
              <div className="flex flex-wrap gap-1.5">
                {lookups.problemAreas.map(opt => {
                  const active = form.problem_area_codes.includes(opt.code)
                  return (
                    <button
                      key={opt.code}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, problem_area_codes: toggleInArray(f.problem_area_codes, opt.code) }))}
                      className={[
                        'px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                        active
                          ? 'bg-[#1C3829] text-white border-[#1C3829]'
                          : 'bg-white text-[#6B7569] border-[#E0DAD0] hover:border-[#1C3829]',
                      ].join(' ')}
                    >
                      {opt.label_da}
                    </button>
                  )
                })}
              </div>
            </div>
          </FormSection>

          {/* ── Ønsker til fagperson ── */}
          <FormSection title="Ønsker til fagperson">
            <div>
              <label className={labelClass}>Mål for indsatsen (valgfri)</label>
              <div className="flex flex-wrap gap-1.5">
                {lookups.goals.map(opt => {
                  const active = form.goal_codes.includes(opt.code)
                  return (
                    <button
                      key={opt.code}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, goal_codes: toggleInArray(f.goal_codes, opt.code) }))}
                      className={[
                        'px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                        active
                          ? 'bg-[#1C3829] text-white border-[#1C3829]'
                          : 'bg-white text-[#6B7569] border-[#E0DAD0] hover:border-[#1C3829]',
                      ].join(' ')}
                    >
                      {opt.label_da}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label className={labelClass}>Særlige ønsker (valgfri)</label>
              <div className="flex flex-wrap gap-1.5">
                {lookups.specialWishes.map(opt => {
                  const active = form.special_wish_codes.includes(opt.code)
                  return (
                    <button
                      key={opt.code}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, special_wish_codes: toggleInArray(f.special_wish_codes, opt.code) }))}
                      className={[
                        'px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                        active
                          ? 'bg-[#1C3829] text-white border-[#1C3829]'
                          : 'bg-white text-[#6B7569] border-[#E0DAD0] hover:border-[#1C3829]',
                      ].join(' ')}
                    >
                      {opt.label_da}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <label className={labelClass}>Foretrukket fagperson køn (hvis begrundet)</label>
              <div className="grid grid-cols-3 gap-2">
                {PROF_GENDER_OPTIONS.map(g => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, preferred_prof_gender: f.preferred_prof_gender === g ? '' : g }))}
                    className={[
                      'h-10 rounded-xl text-xs font-medium border transition-all',
                      form.preferred_prof_gender === g
                        ? 'bg-[#1C3829] text-white border-[#1C3829]'
                        : 'bg-white text-[#6B7569] border-[#E0DAD0] hover:border-[#1C3829]',
                    ].join(' ')}
                  >
                    {PROF_GENDER_LABEL[g]}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className={labelClass}>Sprogkrav (valgfri — vælg alle relevante)</label>
              <div className="flex flex-wrap gap-1.5">
                {LANGUAGE_OPTIONS.map(lang => {
                  const active = form.required_languages.includes(lang)
                  return (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, required_languages: toggleInArray(f.required_languages, lang) }))}
                      className={[
                        'px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                        active
                          ? 'bg-[#1C3829] text-white border-[#1C3829]'
                          : 'bg-white text-[#6B7569] border-[#E0DAD0] hover:border-[#1C3829]',
                      ].join(' ')}
                    >
                      {lang}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className={labelClass}>Transportbehov</label>
                <div className="grid grid-cols-2 gap-2">
                  {TRANSPORT_OPTIONS.map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, transport_needs: f.transport_needs === opt ? '' : opt }))}
                      className={[
                        'h-10 rounded-xl text-xs font-medium border transition-all',
                        form.transport_needs === opt
                          ? 'bg-[#1C3829] text-white border-[#1C3829]'
                          : 'bg-white text-[#6B7569] border-[#E0DAD0] hover:border-[#1C3829]',
                      ].join(' ')}
                    >
                      {opt === 'JA' ? 'Ja — kørsel' : 'Nej — lokal'}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className={labelClass}>Geografisk område</label>
                <input
                  type="text"
                  value={form.geographical_area}
                  onChange={field('geographical_area')}
                  placeholder="By / bydel / postnr."
                  className={inputClass}
                />
              </div>
            </div>
          </FormSection>

          {/* ── Interne noter ── */}
          <FormSection title="Interne noter">
            <div>
              <label className={labelClass}>Sagsnoter (valgfri)</label>
              <textarea
                value={form.citizen_notes}
                onChange={field('citizen_notes')}
                rows={4}
                placeholder="Baggrundsinformation, særlige hensyn, kommunikation med kommunen, øvrige bemærkninger..."
                className={`${inputClass} resize-none`}
              />
              <p className="text-[10px] text-[#6B7569] mt-1.5">Gemmes kun internt — deles aldrig med kommunen eller fagpersonen</p>
            </div>
          </FormSection>

          {error && (
            <div className="flex items-center gap-2 p-3 bg-[#FEE2E2] border border-[#FECACA] rounded-xl text-sm text-[#B91C1C]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-4 sm:px-8 border-t border-[#E0DAD0] shrink-0 flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={closeDrawer} disabled={saving}>
            Annuller
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            loading={saving}
            onClick={handleCreate}
          >
            Opret sag
          </Button>
        </div>
      </aside>
    </>
  )
}

function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  )
}

function CaseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  )
}
