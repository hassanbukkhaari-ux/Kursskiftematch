'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

type Status = 'OPEN' | 'MATCHED' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED'
type Complexity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
type Urgency = 'NORMAL' | 'HURTIG' | 'AKUT'
type Gender = 'MALE' | 'FEMALE' | 'OTHER'
type LegalBasis = 'BARNETS_LOV_32' | 'SEL_76' | 'SEL_85' | 'SEL_99'
type ProfGender = 'MALE' | 'FEMALE' | 'NO_PREF'
type TransportNeeds = 'JA' | 'NEJ'

interface LookupOption { code: string; label_da: string }

interface ComplexityFactors {
  violence: boolean
  substance_use: boolean
  mental_health: boolean
  criminality: boolean
  family_instability: boolean
  school: boolean
  multiple_agencies: boolean
  diagnosis: string | null
  notes: string | null
}

interface Props {
  caseId: string
  status: Status
  complexityLevel: Complexity
  urgency: Urgency
  weeklyHours: number
  citizenNotes: string | null
  intakeContactName: string | null
  intakeContactEmail: string | null
  intakeContactPhone: string | null
  citizenGender: Gender | null
  legalBasis: LegalBasis | null
  expectedDurationMonths: number | null
  diagnoses: string | null
  dailyFunction: string | null
  citizenInterests: string | null
  preferredProfGender: ProfGender | null
  transportNeeds: TransportNeeds | null
  geographicalArea: string | null
  requiresEvening: boolean
  requiresWeekend: boolean
  requiresNight: boolean
  problemAreaCodes: string[]
  goalCodes: string[]
  specialWishCodes: string[]
  problemAreaOptions: LookupOption[]
  goalOptions: LookupOption[]
  specialWishOptions: LookupOption[]
  complexityFactors: ComplexityFactors | null
}

const STATUS_OPTIONS: { value: Status; label: string }[] = [
  { value: 'OPEN', label: 'Åben' },
  { value: 'MATCHED', label: 'Matchet' },
  { value: 'ACTIVE', label: 'Aktiv' },
  { value: 'COMPLETED', label: 'Afsluttet' },
  { value: 'ARCHIVED', label: 'Arkiveret' },
]
const COMPLEXITY_OPTIONS: { value: Complexity; label: string }[] = [
  { value: 'LOW', label: 'Lav' },
  { value: 'MEDIUM', label: 'Mellem' },
  { value: 'HIGH', label: 'Høj' },
  { value: 'CRITICAL', label: 'Kritisk' },
]
const URGENCY_OPTIONS: { value: Urgency; label: string }[] = [
  { value: 'NORMAL', label: '⚪ Normal' },
  { value: 'HURTIG', label: '🟡 Hurtig' },
  { value: 'AKUT', label: '🔴 Akut' },
]
const GENDER_OPTIONS: { value: Gender | ''; label: string }[] = [
  { value: '', label: 'Ikke angivet' },
  { value: 'MALE', label: 'Dreng/mand' },
  { value: 'FEMALE', label: 'Pige/kvinde' },
  { value: 'OTHER', label: 'Andet' },
]
const LEGAL_BASIS_OPTIONS: { value: LegalBasis | ''; label: string }[] = [
  { value: '', label: 'Ikke angivet' },
  { value: 'BARNETS_LOV_32', label: 'Barnets lov §32' },
  { value: 'SEL_76', label: 'SEL §76' },
  { value: 'SEL_85', label: 'SEL §85' },
  { value: 'SEL_99', label: 'SEL §99' },
]
const PROF_GENDER_OPTIONS: { value: ProfGender | ''; label: string }[] = [
  { value: '', label: 'Ikke angivet' },
  { value: 'NO_PREF', label: 'Ingen præference' },
  { value: 'MALE', label: 'Mand' },
  { value: 'FEMALE', label: 'Kvinde' },
]
const TRANSPORT_OPTIONS: { value: TransportNeeds | ''; label: string }[] = [
  { value: '', label: 'Ikke angivet' },
  { value: 'JA', label: 'Ja' },
  { value: 'NEJ', label: 'Nej' },
]

const inputClass = 'w-full border border-[#E0DAD0] rounded-xl px-3 py-2 text-sm text-[#1A1F1C] focus:outline-none focus:ring-2 focus:ring-[#1C3829]/20 bg-white'
const labelClass = 'text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] block mb-1'

function toggleInArray(arr: string[], code: string) {
  return arr.includes(code) ? arr.filter(c => c !== code) : [...arr, code]
}

export default function AdminCaseEditClient(props: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, startSave] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const [form, setForm] = useState({
    status: props.status,
    complexity_level: props.complexityLevel,
    urgency: props.urgency,
    weekly_hours: props.weeklyHours,
    citizen_notes: props.citizenNotes ?? '',
    intake_contact_name: props.intakeContactName ?? '',
    intake_contact_email: props.intakeContactEmail ?? '',
    intake_contact_phone: props.intakeContactPhone ?? '',
    citizen_gender: props.citizenGender ?? '',
    legal_basis: props.legalBasis ?? '',
    expected_duration_months: props.expectedDurationMonths ?? '',
    diagnoses: props.diagnoses ?? '',
    daily_function: props.dailyFunction ?? '',
    citizen_interests: props.citizenInterests ?? '',
    preferred_prof_gender: props.preferredProfGender ?? '',
    transport_needs: props.transportNeeds ?? '',
    geographical_area: props.geographicalArea ?? '',
    requires_evening: props.requiresEvening,
    requires_weekend: props.requiresWeekend,
    requires_night: props.requiresNight,
    problem_area_codes: props.problemAreaCodes,
    goal_codes: props.goalCodes,
    special_wish_codes: props.specialWishCodes,
  })

  const [factors, setFactors] = useState<ComplexityFactors>(
    props.complexityFactors ?? {
      violence: false, substance_use: false, mental_health: false, criminality: false,
      family_instability: false, school: false, multiple_agencies: false, diagnosis: '', notes: '',
    }
  )

  function handleSave() {
    startSave(async () => {
      setError(null)
      setSuccess(false)

      const [caseRes, complexityRes] = await Promise.all([
        fetch(`/api/cases/${props.caseId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            status: form.status,
            complexity_level: form.complexity_level,
            urgency: form.urgency,
            weekly_hours: Number(form.weekly_hours),
            citizen_notes: form.citizen_notes || undefined,
            intake_contact_name: form.intake_contact_name || null,
            intake_contact_email: form.intake_contact_email || null,
            intake_contact_phone: form.intake_contact_phone || null,
            citizen_gender: form.citizen_gender || null,
            legal_basis: form.legal_basis || null,
            expected_duration_months: form.expected_duration_months ? Number(form.expected_duration_months) : null,
            diagnoses: form.diagnoses || null,
            daily_function: form.daily_function || null,
            citizen_interests: form.citizen_interests || null,
            preferred_prof_gender: form.preferred_prof_gender || null,
            transport_needs: form.transport_needs || null,
            geographical_area: form.geographical_area || null,
            requires_evening: form.requires_evening,
            requires_weekend: form.requires_weekend,
            requires_night: form.requires_night,
            problem_area_codes: form.problem_area_codes,
            goal_codes: form.goal_codes,
            special_wish_codes: form.special_wish_codes,
          }),
        }),
        fetch(`/api/cases/${props.caseId}/complexity`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(factors),
        }),
      ])

      if (!caseRes.ok) {
        const d = await caseRes.json().catch(() => ({}))
        setError((d as { error?: string }).error ?? 'Noget gik galt')
        return
      }
      if (!complexityRes.ok) {
        const d = await complexityRes.json().catch(() => ({}))
        setError((d as { error?: string }).error ?? 'Kompleksitetsfaktorer kunne ikke gemmes')
        return
      }
      setSuccess(true)
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <Card>
      <div className="flex items-center justify-between mb-3">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569]">Rediger sag</div>
        {!open && (
          <button
            type="button"
            onClick={() => { setOpen(true); setError(null); setSuccess(false) }}
            className="text-[10px] font-semibold uppercase tracking-widest text-[#1C3829] hover:underline"
          >
            Rediger
          </button>
        )}
      </div>

      {success && !open && (
        <p className="text-xs text-[#1C3829]">Ændringer gemt.</p>
      )}

      {!open && (
        <div className="space-y-1 text-xs text-[#6B7569]">
          <div><span className="font-medium text-[#1A1F1C]">Status:</span> {STATUS_OPTIONS.find(s => s.value === form.status)?.label}</div>
          <div><span className="font-medium text-[#1A1F1C]">Kompleksitet:</span> {COMPLEXITY_OPTIONS.find(c => c.value === form.complexity_level)?.label}</div>
          <div><span className="font-medium text-[#1A1F1C]">Hastighed:</span> {URGENCY_OPTIONS.find(u => u.value === form.urgency)?.label}</div>
          <div><span className="font-medium text-[#1A1F1C]">Timer/uge:</span> {form.weekly_hours}</div>
          {form.intake_contact_name && (
            <div><span className="font-medium text-[#1A1F1C]">Sagsbehandler:</span> {form.intake_contact_name}</div>
          )}
        </div>
      )}

      {open && (
        <div className="space-y-3">
          {error && (
            <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">{error}</div>
          )}

          <div>
            <label className={labelClass}>Status</label>
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as Status }))} className={inputClass}>
              {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>

          <div>
            <label className={labelClass}>Kompleksitet</label>
            <select value={form.complexity_level} onChange={e => setForm(f => ({ ...f, complexity_level: e.target.value as Complexity }))} className={inputClass}>
              {COMPLEXITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <p className="text-[11px] text-[#9B9589] mt-1">Genberegnes automatisk ud fra kompleksitetsfaktorerne nedenfor, når de gemmes.</p>
          </div>

          <div>
            <label className={labelClass}>Hastighed</label>
            <div className="flex gap-1.5">
              {URGENCY_OPTIONS.map(o => (
                <button
                  key={o.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, urgency: o.value }))}
                  className={[
                    'flex-1 h-8 rounded-xl text-xs font-medium border transition-all',
                    form.urgency === o.value
                      ? 'bg-[#1C3829] text-white border-[#1C3829]'
                      : 'bg-white text-[#6B7569] border-[#E0DAD0] hover:border-[#1C3829]',
                  ].join(' ')}
                >
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={labelClass}>Timer/uge</label>
            <input
              type="number"
              min="0"
              step="0.5"
              value={form.weekly_hours}
              onChange={e => setForm(f => ({ ...f, weekly_hours: Number(e.target.value) }))}
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Interne noter</label>
            <textarea
              value={form.citizen_notes}
              onChange={e => setForm(f => ({ ...f, citizen_notes: e.target.value }))}
              rows={3}
              className={`${inputClass} resize-none`}
              placeholder="Interne noter om sagen..."
            />
          </div>

          <div className="pt-1 border-t border-[#E0DAD0] space-y-2">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A]">Borgerprofil</div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelClass}>Køn</label>
                <select value={form.citizen_gender} onChange={e => setForm(f => ({ ...f, citizen_gender: e.target.value as Gender | '' }))} className={inputClass}>
                  {GENDER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Retsgrundlag</label>
                <select value={form.legal_basis} onChange={e => setForm(f => ({ ...f, legal_basis: e.target.value as LegalBasis | '' }))} className={inputClass}>
                  {LEGAL_BASIS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className={labelClass}>Forventet varighed (måneder)</label>
              <input
                type="number"
                min="1"
                value={form.expected_duration_months}
                onChange={e => setForm(f => ({ ...f, expected_duration_months: e.target.value }))}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Diagnoser</label>
              <textarea value={form.diagnoses} onChange={e => setForm(f => ({ ...f, diagnoses: e.target.value }))} rows={2} className={`${inputClass} resize-none`} />
            </div>
            <div>
              <label className={labelClass}>Dagligt funktionsniveau</label>
              <textarea value={form.daily_function} onChange={e => setForm(f => ({ ...f, daily_function: e.target.value }))} rows={2} className={`${inputClass} resize-none`} />
            </div>
            <div>
              <label className={labelClass}>Interesser</label>
              <textarea value={form.citizen_interests} onChange={e => setForm(f => ({ ...f, citizen_interests: e.target.value }))} rows={2} className={`${inputClass} resize-none`} />
            </div>
          </div>

          <div className="pt-1 border-t border-[#E0DAD0] space-y-2">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A]">Logistik</div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelClass}>Foretrukket køn (kontaktperson)</label>
                <select value={form.preferred_prof_gender} onChange={e => setForm(f => ({ ...f, preferred_prof_gender: e.target.value as ProfGender | '' }))} className={inputClass}>
                  {PROF_GENDER_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Transportbehov</label>
                <select value={form.transport_needs} onChange={e => setForm(f => ({ ...f, transport_needs: e.target.value as TransportNeeds | '' }))} className={inputClass}>
                  {TRANSPORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className={labelClass}>Geografisk område</label>
              <input type="text" value={form.geographical_area} onChange={e => setForm(f => ({ ...f, geographical_area: e.target.value }))} className={inputClass} />
            </div>
            <div className="flex gap-3 pt-1">
              {[
                { key: 'requires_evening' as const, label: 'Aften' },
                { key: 'requires_weekend' as const, label: 'Weekend' },
                { key: 'requires_night' as const, label: 'Nat' },
              ].map(o => (
                <label key={o.key} className="flex items-center gap-1.5 text-xs text-[#1A1F1C]">
                  <input
                    type="checkbox"
                    checked={form[o.key]}
                    onChange={e => setForm(f => ({ ...f, [o.key]: e.target.checked }))}
                  />
                  {o.label}
                </label>
              ))}
            </div>
          </div>

          {props.problemAreaOptions.length > 0 && (
            <div className="pt-1 border-t border-[#E0DAD0] space-y-2">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A]">Problemområder</div>
              <div className="flex flex-wrap gap-1.5">
                {props.problemAreaOptions.map(opt => (
                  <button
                    key={opt.code}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, problem_area_codes: toggleInArray(f.problem_area_codes, opt.code) }))}
                    className={[
                      'px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                      form.problem_area_codes.includes(opt.code)
                        ? 'bg-[#1C3829] text-white border-[#1C3829]'
                        : 'bg-white text-[#6B7569] border-[#E0DAD0] hover:border-[#1C3829]',
                    ].join(' ')}
                  >
                    {opt.label_da}
                  </button>
                ))}
              </div>
            </div>
          )}

          {props.goalOptions.length > 0 && (
            <div className="space-y-2">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A]">Mål</div>
              <div className="flex flex-wrap gap-1.5">
                {props.goalOptions.map(opt => (
                  <button
                    key={opt.code}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, goal_codes: toggleInArray(f.goal_codes, opt.code) }))}
                    className={[
                      'px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                      form.goal_codes.includes(opt.code)
                        ? 'bg-[#1C3829] text-white border-[#1C3829]'
                        : 'bg-white text-[#6B7569] border-[#E0DAD0] hover:border-[#1C3829]',
                    ].join(' ')}
                  >
                    {opt.label_da}
                  </button>
                ))}
              </div>
            </div>
          )}

          {props.specialWishOptions.length > 0 && (
            <div className="space-y-2">
              <div className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A]">Særlige ønsker</div>
              <div className="flex flex-wrap gap-1.5">
                {props.specialWishOptions.map(opt => (
                  <button
                    key={opt.code}
                    type="button"
                    onClick={() => setForm(f => ({ ...f, special_wish_codes: toggleInArray(f.special_wish_codes, opt.code) }))}
                    className={[
                      'px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                      form.special_wish_codes.includes(opt.code)
                        ? 'bg-[#1C3829] text-white border-[#1C3829]'
                        : 'bg-white text-[#6B7569] border-[#E0DAD0] hover:border-[#1C3829]',
                    ].join(' ')}
                  >
                    {opt.label_da}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="pt-1 border-t border-[#E0DAD0] space-y-2">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A]">Kompleksitetsfaktorer</div>
            <div className="grid grid-cols-2 gap-1.5">
              {[
                { key: 'violence' as const, label: 'Vold' },
                { key: 'substance_use' as const, label: 'Misbrug' },
                { key: 'mental_health' as const, label: 'Psykisk sårbarhed' },
                { key: 'criminality' as const, label: 'Kriminalitet' },
                { key: 'family_instability' as const, label: 'Familiær ustabilitet' },
                { key: 'school' as const, label: 'Skoleproblemer' },
                { key: 'multiple_agencies' as const, label: 'Flere instanser involveret' },
              ].map(o => (
                <label key={o.key} className="flex items-center gap-1.5 text-xs text-[#1A1F1C]">
                  <input
                    type="checkbox"
                    checked={factors[o.key]}
                    onChange={e => setFactors(f => ({ ...f, [o.key]: e.target.checked }))}
                  />
                  {o.label}
                </label>
              ))}
            </div>
            <textarea
              value={factors.notes ?? ''}
              onChange={e => setFactors(f => ({ ...f, notes: e.target.value }))}
              rows={2}
              placeholder="Noter om kompleksitetsvurderingen..."
              className={`${inputClass} resize-none`}
            />
          </div>

          <div className="pt-1 border-t border-[#E0DAD0]">
            <div className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A] mb-2">Sagsbehandler</div>
            <div className="space-y-2">
              <input
                type="text"
                value={form.intake_contact_name}
                onChange={e => setForm(f => ({ ...f, intake_contact_name: e.target.value }))}
                placeholder="Fuldt navn"
                className={inputClass}
              />
              <input
                type="email"
                value={form.intake_contact_email}
                onChange={e => setForm(f => ({ ...f, intake_contact_email: e.target.value }))}
                placeholder="E-mailadresse"
                className={inputClass}
              />
              <input
                type="tel"
                value={form.intake_contact_phone}
                onChange={e => setForm(f => ({ ...f, intake_contact_phone: e.target.value }))}
                placeholder="Telefonnummer"
                className={inputClass}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="primary" size="sm" loading={saving} onClick={handleSave} className="flex-1 justify-center">
              Gem
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => setOpen(false)}>
              Annuller
            </Button>
          </div>
        </div>
      )}
    </Card>
  )
}
