'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface LookupItem { id: string; code: string; label_da: string }
interface Municipality { id: string; name: string }

interface Props {
  municipalities: Municipality[]
  problemAreas: LookupItem[]
  goals: LookupItem[]
  specialWishes: LookupItem[]
}

const AGE_RANGES = ['0-17', '18-30', '31-50', '51-65', '65+'] as const
const GENDERS = [
  { value: 'MALE', label: 'Mand' },
  { value: 'FEMALE', label: 'Kvinde' },
  { value: 'OTHER', label: 'Andet' },
  { value: 'UNKNOWN', label: 'Ukendt' },
]

export default function IntakeForm({ municipalities, problemAreas, goals, specialWishes }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [municipalityId, setMunicipalityId] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [citizenInitials, setCitizenInitials] = useState('')
  const [ageRange, setAgeRange] = useState<string>('')
  const [gender, setGender] = useState<string>('')
  const [weeklyHours, setWeeklyHours] = useState('')
  const [citizenNotes, setCitizenNotes] = useState('')
  const [selectedProblemAreas, setSelectedProblemAreas] = useState<string[]>([])
  const [selectedGoals, setSelectedGoals] = useState<string[]>([])
  const [selectedWishes, setSelectedWishes] = useState<string[]>([])

  function toggleItem(list: string[], setList: (v: string[]) => void, id: string) {
    setList(list.includes(id) ? list.filter(x => x !== id) : [...list, id])
  }

  function handleSubmit() {
    setError(null)
    if (!municipalityId) { setError('Vælg en kommune'); return }
    if (!contactName.trim()) { setError('Angiv kontaktpersonens navn'); return }
    if (!contactEmail.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contactEmail.trim())) { setError('Angiv en gyldig e-mailadresse'); return }
    if (!citizenInitials.trim()) { setError('Angiv borgerens initialer'); return }
    if (!ageRange) { setError('Vælg aldersgruppe'); return }
    const hours = parseFloat(weeklyHours)
    if (!weeklyHours || isNaN(hours) || hours <= 0) { setError('Angiv et gyldigt antal timer pr. uge'); return }

    startTransition(async () => {
      try {
        const res = await fetch('/api/intake/case', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            municipality_id: municipalityId,
            contact_name: contactName.trim(),
            contact_email: contactEmail.trim(),
            citizen_initials: citizenInitials.trim(),
            citizen_age_range: ageRange,
            citizen_gender: gender || undefined,
            weekly_hours: hours,
            citizen_notes: citizenNotes.trim() || undefined,
            problem_area_ids: selectedProblemAreas.length ? selectedProblemAreas : undefined,
            goal_ids: selectedGoals.length ? selectedGoals : undefined,
            special_wish_ids: selectedWishes.length ? selectedWishes : undefined,
          }),
        })
        if (!res.ok) {
          const json = await res.json().catch(() => ({}))
          throw new Error(json.error ?? `Fejl ${res.status}`)
        }
        const data = await res.json()
        router.push(`/status/${data.intake_token}`)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Ukendt fejl')
      }
    })
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {/* Municipality */}
      <Section title="Kommuneoplysninger">
        <Field label="Kommune *">
          <select
            className="w-full rounded-lg border border-[#E0DAD0] bg-white px-3 py-2 text-sm text-[#1A1F1C] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]"
            value={municipalityId}
            onChange={e => setMunicipalityId(e.target.value)}
          >
            <option value="">Vælg kommune…</option>
            {municipalities.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </Field>
        <Field label="Dit navn (sagsbehandler) *">
          <input
            type="text"
            className={inputCls}
            placeholder="Fulde navn"
            value={contactName}
            onChange={e => setContactName(e.target.value)}
          />
        </Field>
        <Field label="Din e-mailadresse *">
          <input
            type="email"
            className={inputCls}
            placeholder="navn@kommune.dk"
            value={contactEmail}
            onChange={e => setContactEmail(e.target.value)}
          />
        </Field>
      </Section>

      {/* Citizen info */}
      <Section title="Borgeroplysninger">
        <Field label="Initialer *">
          <input
            type="text"
            className={inputCls}
            placeholder="f.eks. PH"
            maxLength={10}
            value={citizenInitials}
            onChange={e => setCitizenInitials(e.target.value)}
          />
        </Field>
        <Field label="Aldersgruppe *">
          <div className="flex flex-wrap gap-2">
            {AGE_RANGES.map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setAgeRange(r)}
                className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                  ageRange === r
                    ? 'bg-[#2D6A4F] text-white border-[#2D6A4F]'
                    : 'bg-white text-[#1A1F1C] border-[#E0DAD0] hover:border-[#2D6A4F]'
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Køn">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setGender('')}
              className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                !gender ? 'bg-[#2D6A4F] text-white border-[#2D6A4F]' : 'bg-white text-[#1A1F1C] border-[#E0DAD0] hover:border-[#2D6A4F]'
              }`}
            >
              Ikke angivet
            </button>
            {GENDERS.map(g => (
              <button
                key={g.value}
                type="button"
                onClick={() => setGender(g.value)}
                className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                  gender === g.value ? 'bg-[#2D6A4F] text-white border-[#2D6A4F]' : 'bg-white text-[#1A1F1C] border-[#E0DAD0] hover:border-[#2D6A4F]'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </Field>
        <Field label="Timer pr. uge *">
          <input
            type="number"
            className={inputCls}
            placeholder="f.eks. 5"
            min="0.5"
            step="0.5"
            value={weeklyHours}
            onChange={e => setWeeklyHours(e.target.value)}
          />
        </Field>
        <Field label="Yderligere bemærkninger">
          <textarea
            className={`${inputCls} resize-none`}
            rows={3}
            placeholder="Særlige hensyn, baggrund eller kontekst…"
            value={citizenNotes}
            onChange={e => setCitizenNotes(e.target.value)}
          />
        </Field>
      </Section>

      {/* Problem areas */}
      {problemAreas.length > 0 && (
        <Section title="Problemområder">
          <CheckGrid
            items={problemAreas}
            selected={selectedProblemAreas}
            toggle={id => toggleItem(selectedProblemAreas, setSelectedProblemAreas, id)}
          />
        </Section>
      )}

      {/* Goals */}
      {goals.length > 0 && (
        <Section title="Mål for forløbet">
          <CheckGrid
            items={goals}
            selected={selectedGoals}
            toggle={id => toggleItem(selectedGoals, setSelectedGoals, id)}
          />
        </Section>
      )}

      {/* Special wishes */}
      {specialWishes.length > 0 && (
        <Section title="Særlige ønsker">
          <CheckGrid
            items={specialWishes}
            selected={selectedWishes}
            toggle={id => toggleItem(selectedWishes, setSelectedWishes, id)}
          />
        </Section>
      )}

      <Button
        variant="primary"
        size="lg"
        className="w-full justify-center"
        loading={pending}
        onClick={handleSubmit}
      >
        Indsend sag
      </Button>
    </div>
  )
}

const inputCls = 'w-full rounded-lg border border-[#E0DAD0] bg-white px-3 py-2 text-sm text-[#1A1F1C] placeholder:text-[#9A9E97] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F]'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-[#E0DAD0] bg-white p-6 space-y-4">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569]">{title}</div>
      {children}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-[#1A1F1C] mb-1">{label}</label>
      {children}
    </div>
  )
}

function CheckGrid({ items, selected, toggle }: {
  items: LookupItem[]
  selected: string[]
  toggle: (id: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map(item => (
        <button
          key={item.id}
          type="button"
          onClick={() => toggle(item.id)}
          className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
            selected.includes(item.id)
              ? 'bg-[#2D6A4F] text-white border-[#2D6A4F]'
              : 'bg-white text-[#1A1F1C] border-[#E0DAD0] hover:border-[#2D6A4F]'
          }`}
        >
          {item.label_da}
        </button>
      ))}
    </div>
  )
}
