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

// ─────────────────────────────────────────────────────────────────────────────
// TODO(migration): All option sets below belong to NEW intake fields that are
// not yet persisted. They require new columns / lookup tables in the intake
// schema plus API route + Zod schema support. Until that migration lands, the
// fields are collected in the form state only and intentionally NOT included
// in the POST payload.
// ─────────────────────────────────────────────────────────────────────────────

type GenderPreference = '' | 'FEMALE' | 'MALE'
const GENDER_PREFERENCES: { value: GenderPreference; label: string }[] = [
  { value: '', label: 'Intet ønske' },
  { value: 'FEMALE', label: 'Kvinde foretrækkes' },
  { value: 'MALE', label: 'Mand foretrækkes' },
]

const PROFESSION_GROUPS: { category: string; items: string[] }[] = [
  {
    category: 'Social- og pædagogiske',
    items: [
      'Socialpædagog', 'Pædagog', 'Pædagogmedhjælper', 'Familiebehandler',
      'Familiekonsulent', 'Kontaktperson', 'Støtteperson', 'Mentor',
      'Bostøttemedarbejder (§85)', 'Socialfaglig konsulent', 'Gadeplansmedarbejder',
      'SSP-medarbejder', 'Ungekonsulent', 'Opsøgende medarbejder',
    ],
  },
  {
    category: 'Sundhed',
    items: [
      'Social- og sundhedsassistent (SSA)', 'Social- og sundhedshjælper (SSH)',
      'Sygeplejerske', 'Psykiatrisk sygeplejerske', 'Ergoterapeut',
      'Fysioterapeut', 'Psykomotorisk terapeut',
    ],
  },
  {
    category: 'Psykologi og terapi',
    items: [
      'Psykolog', 'Psykoterapeut', 'Familieterapeut', 'Narrativ terapeut',
      'Misbrugsbehandler', 'Rusmiddelkonsulent',
    ],
  },
  {
    category: 'Skole og uddannelse',
    items: ['Lærer', 'Speciallærer', 'UU-vejleder', 'SPS-vejleder', 'AKT-medarbejder', 'Skolepædagog'],
  },
  {
    category: 'Beskæftigelse',
    items: ['Jobkonsulent', 'Virksomhedskonsulent', 'Beskæftigelsesmentor'],
  },
  {
    category: 'Kriminalitetsforebyggelse',
    items: ['Exit-medarbejder', 'Konfliktmægler', 'Kriminalpræventiv medarbejder'],
  },
  {
    category: 'Andet',
    items: ['Studerende (relevant uddannelse)', 'Anden relevant socialfaglig baggrund (med beskrivelse)'],
  },
]
const PROFESSION_OTHER = 'Anden relevant socialfaglig baggrund (med beskrivelse)'

type DrivingTime = '' | '15' | '30' | '45' | '60+'
const DRIVING_TIMES: { value: DrivingTime; label: string }[] = [
  { value: '15', label: '15 min' },
  { value: '30', label: '30 min' },
  { value: '45', label: '45 min' },
  { value: '60+', label: '60+ min' },
]

type StartUrgency = '' | 'ACUTE' | 'WITHIN_1_WEEK' | 'WITHIN_2_WEEKS' | 'FLEXIBLE'
const START_URGENCIES: { value: StartUrgency; label: string }[] = [
  { value: 'ACUTE', label: 'Akut (24–48 timer)' },
  { value: 'WITHIN_1_WEEK', label: 'Inden for 1 uge' },
  { value: 'WITHIN_2_WEEKS', label: 'Inden for 2 uger' },
  { value: 'FLEXIBLE', label: 'Fleksibel opstart' },
]

const RELATION_TYPES = [
  'Meget strukturerende', 'Motiverende', 'Rolig og lyttende', 'Praktisk støtte',
  'Udadvendt', 'Autoritativ', 'Relationsopbyggende',
]

const INTERESTS = [
  'Gaming', 'Fodbold', 'Fitness', 'Madlavning', 'Musik', 'Natur',
  'Kreative aktiviteter', 'Dyr', 'Biler', 'Fiskeri', 'Friluftsliv',
]

const LANGUAGES = ['Dansk', 'Engelsk', 'Arabisk', 'Somali', 'Tyrkisk', 'Urdu', 'Farsi', 'Andet']

const PRACTICAL_REQUIREMENTS = [
  'Kørekort', 'Bil', 'Røgfri', 'Kan arbejde aften', 'Kan arbejde weekend',
  'Kan ledsage på ferie', 'Kan rejse med borger',
]

type Continuity = '' | 'YES' | 'NO'
const CONTINUITY_OPTIONS: { value: Continuity; label: string }[] = [
  { value: 'YES', label: 'Ja — prioritér kontaktpersoner med stabil langvarig kapacitet' },
  { value: 'NO', label: 'Nej' },
]

type FollowUpFrequency = '' | 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY' | 'AS_NEEDED'
const FOLLOW_UP_FREQUENCIES: { value: FollowUpFrequency; label: string }[] = [
  { value: 'WEEKLY', label: 'Ugentlig' },
  { value: 'BIWEEKLY', label: 'Hver 14. dag' },
  { value: 'MONTHLY', label: 'Månedlig' },
  { value: 'AS_NEEDED', label: 'Efter behov' },
]

const DOCUMENTATION_TYPES = [
  'Kort status', 'Udvidet status', 'Progressionsrapport',
  'Handleplansopfølgning', 'Afslutningsrapport',
]

type Priority = 'MUST' | 'NICE'
interface Criterion { key: string; label: string }

export default function IntakeForm({ municipalities, problemAreas, goals, specialWishes }: Props) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [municipalityId, setMunicipalityId] = useState('')
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [citizenInitials, setCitizenInitials] = useState('')
  const [ageRange, setAgeRange] = useState<string>('')
  const [weeklyHours, setWeeklyHours] = useState('')
  const [citizenNotes, setCitizenNotes] = useState('')
  const [selectedProblemAreas, setSelectedProblemAreas] = useState<string[]>([])
  const [selectedGoals, setSelectedGoals] = useState<string[]>([])
  const [selectedWishes, setSelectedWishes] = useState<string[]>([])

  // TODO(migration): New fields — collected in form state only, not yet sent to
  // the API. Persisting them requires a schema migration + API route changes.
  const [genderPreference, setGenderPreference] = useState<GenderPreference>('')
  const [genderPreferenceReason, setGenderPreferenceReason] = useState('')
  const [selectedProfessions, setSelectedProfessions] = useState<string[]>([])
  const [professionOtherDescription, setProfessionOtherDescription] = useState('')
  const [maxDrivingTime, setMaxDrivingTime] = useState<DrivingTime>('')
  const [startUrgency, setStartUrgency] = useState<StartUrgency>('')
  const [selectedRelationTypes, setSelectedRelationTypes] = useState<string[]>([])
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([])
  const [languageOther, setLanguageOther] = useState('')
  const [selectedPracticalRequirements, setSelectedPracticalRequirements] = useState<string[]>([])
  const [continuityImportant, setContinuityImportant] = useState<Continuity>('')
  const [followUpFrequency, setFollowUpFrequency] = useState<FollowUpFrequency>('')
  const [selectedDocumentationTypes, setSelectedDocumentationTypes] = useState<string[]>([])
  // Must-have / nice-to-have prioritisation of the selected criteria.
  // Keyed by criterion key; anything not in the map defaults to 'NICE'.
  const [priorities, setPriorities] = useState<Record<string, Priority>>({})

  function toggleItem(list: string[], setList: (v: string[]) => void, id: string) {
    setList(list.includes(id) ? list.filter(x => x !== id) : [...list, id])
  }

  function togglePriority(key: string) {
    setPriorities(prev => ({ ...prev, [key]: prev[key] === 'MUST' ? 'NICE' : 'MUST' }))
  }

  // Derive the list of criteria the caseworker has actually filled in, so each
  // can be marked as "Skal" (must-have) or "Ønskeligt" (nice-to-have).
  function buildCriteria(): Criterion[] {
    const criteria: Criterion[] = []
    if (genderPreference) {
      const opt = GENDER_PREFERENCES.find(g => g.value === genderPreference)
      criteria.push({ key: 'gender', label: opt?.label ?? genderPreference })
    }
    for (const p of selectedProfessions) criteria.push({ key: `profession:${p}`, label: p })
    if (maxDrivingTime) criteria.push({ key: 'driving-time', label: `Maks. ${maxDrivingTime} min køretid` })
    if (startUrgency) {
      const opt = START_URGENCIES.find(u => u.value === startUrgency)
      criteria.push({ key: 'urgency', label: `Opstart: ${opt?.label ?? startUrgency}` })
    }
    for (const r of selectedRelationTypes) criteria.push({ key: `relation:${r}`, label: r })
    for (const i of selectedInterests) criteria.push({ key: `interest:${i}`, label: i })
    for (const l of selectedLanguages) {
      criteria.push({ key: `language:${l}`, label: l === 'Andet' && languageOther.trim() ? `Sprog: ${languageOther.trim()}` : `Sprog: ${l}` })
    }
    for (const p of selectedPracticalRequirements) criteria.push({ key: `practical:${p}`, label: p })
    if (continuityImportant === 'YES') criteria.push({ key: 'continuity', label: 'Kontinuitet' })
    return criteria
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
            weekly_hours: hours,
            citizen_notes: citizenNotes.trim() || undefined,
            problem_area_ids: selectedProblemAreas.length ? selectedProblemAreas : undefined,
            goal_ids: selectedGoals.length ? selectedGoals : undefined,
            special_wish_ids: selectedWishes.length ? selectedWishes : undefined,
            // TODO(migration): Include the new fields once the intake schema and
            // API route support them: genderPreference, genderPreferenceReason,
            // selectedProfessions, professionOtherDescription, maxDrivingTime,
            // startUrgency, selectedRelationTypes, selectedInterests,
            // selectedLanguages, languageOther, selectedPracticalRequirements,
            // continuityImportant, followUpFrequency, selectedDocumentationTypes,
            // priorities (must-have / nice-to-have per criterion).
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

  const criteria = buildCriteria()
  const mustCriteria = criteria.filter(c => priorities[c.key] === 'MUST')
  const niceCriteria = criteria.filter(c => priorities[c.key] !== 'MUST')

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
          <PillRadio
            options={AGE_RANGES.map(r => ({ value: r, label: r }))}
            value={ageRange}
            onChange={setAgeRange}
          />
        </Field>
        {/* TODO(migration): genderPreference + genderPreferenceReason are new fields. */}
        <Field label="Ønske til kontaktperson (hvis fagligt begrundet)">
          <PillRadio
            options={GENDER_PREFERENCES}
            value={genderPreference}
            onChange={v => setGenderPreference(v as GenderPreference)}
          />
        </Field>
        {genderPreference !== '' && (
          <Field label="Begrundelse (valgfri, men anbefales hvis køn er valgt)">
            <input
              type="text"
              className={inputCls}
              placeholder="Kort faglig begrundelse…"
              value={genderPreferenceReason}
              onChange={e => setGenderPreferenceReason(e.target.value)}
            />
          </Field>
        )}
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

      {/* Professional profile — TODO(migration): new fields */}
      <Section title="Faglig profil">
        <Field label="Ønskede professioner (vælg alle relevante)">
          <div className="space-y-4">
            {PROFESSION_GROUPS.map(group => (
              <div key={group.category}>
                <div className="text-[10px] font-semibold uppercase tracking-widest text-[#9B9590] mb-2">{group.category}</div>
                <PillCheckGroup
                  options={group.items}
                  selected={selectedProfessions}
                  toggle={p => toggleItem(selectedProfessions, setSelectedProfessions, p)}
                />
              </div>
            ))}
          </div>
        </Field>
        {selectedProfessions.includes(PROFESSION_OTHER) && (
          <Field label="Beskrivelse af anden socialfaglig baggrund">
            <input
              type="text"
              className={inputCls}
              placeholder="Beskriv den ønskede baggrund…"
              value={professionOtherDescription}
              onChange={e => setProfessionOtherDescription(e.target.value)}
            />
          </Field>
        )}
        <Field label="Forventet relationstype (sæt kryds ved det mest relevante)">
          <PillCheckGroup
            options={RELATION_TYPES}
            selected={selectedRelationTypes}
            toggle={r => toggleItem(selectedRelationTypes, setSelectedRelationTypes, r)}
          />
        </Field>
      </Section>

      {/* Practical requirements — TODO(migration): new fields */}
      <Section title="Praktiske krav">
        <Field label="Maksimal køretid fra kontaktpersonens bopæl">
          <PillRadio
            options={DRIVING_TIMES}
            value={maxDrivingTime}
            onChange={v => setMaxDrivingTime(v as DrivingTime)}
          />
        </Field>
        <Field label="Praktiske krav til kontaktperson">
          <PillCheckGroup
            options={PRACTICAL_REQUIREMENTS}
            selected={selectedPracticalRequirements}
            toggle={p => toggleItem(selectedPracticalRequirements, setSelectedPracticalRequirements, p)}
          />
        </Field>
        <Field label="Borgeren taler (primære sprog)">
          <PillCheckGroup
            options={LANGUAGES}
            selected={selectedLanguages}
            toggle={l => toggleItem(selectedLanguages, setSelectedLanguages, l)}
          />
        </Field>
        {selectedLanguages.includes('Andet') && (
          <Field label="Andet sprog">
            <input
              type="text"
              className={inputCls}
              placeholder="Angiv sprog…"
              value={languageOther}
              onChange={e => setLanguageOther(e.target.value)}
            />
          </Field>
        )}
        <Field label="Borgerens interesser (bruges til at skabe fælles grundlag)">
          <PillCheckGroup
            options={INTERESTS}
            selected={selectedInterests}
            toggle={i => toggleItem(selectedInterests, setSelectedInterests, i)}
          />
        </Field>
      </Section>

      {/* Start & follow-up — TODO(migration): new fields */}
      <Section title="Opstart og opfølgning">
        <Field label="Hvornår er der behov for opstart?">
          <PillRadio
            options={START_URGENCIES}
            value={startUrgency}
            onChange={v => setStartUrgency(v as StartUrgency)}
          />
        </Field>
        <Field label="Er kontinuitet særligt vigtig i denne sag?">
          <PillRadio
            options={CONTINUITY_OPTIONS}
            value={continuityImportant}
            onChange={v => setContinuityImportant(v as Continuity)}
          />
        </Field>
        <Field label="Ønsket opfølgningshyppighed fra Kursskifte">
          <PillRadio
            options={FOLLOW_UP_FREQUENCIES}
            value={followUpFrequency}
            onChange={v => setFollowUpFrequency(v as FollowUpFrequency)}
          />
        </Field>
        <Field label="Hvilken dokumentation ønskes løbende?">
          <PillCheckGroup
            options={DOCUMENTATION_TYPES}
            selected={selectedDocumentationTypes}
            toggle={d => toggleItem(selectedDocumentationTypes, setSelectedDocumentationTypes, d)}
          />
        </Field>
      </Section>

      {/* Prioritisation — TODO(migration): new field (priorities map) */}
      <div className="rounded-2xl border-2 border-[#C8993A] bg-white p-6 space-y-4">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-widest text-[#92660A]">Prioritering af kriterier</div>
          <p className="text-xs text-[#6B7569] mt-2 leading-relaxed">
            Angiv for hvert valgte kriterium om det er et <strong className="text-[#1A1F1C]">krav</strong> eller
            et <strong className="text-[#1A1F1C]">ønske</strong>. Klik på et kriterium for at flytte det.
            Det fortæller matchteamet, hvad der er ufravigeligt, og hvad der er foretrukket.
          </p>
        </div>
        {criteria.length === 0 ? (
          <p className="text-xs text-[#9B9590]">Udfyld kriterierne ovenfor — de vises her, så du kan prioritere dem.</p>
        ) : (
          <>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-[#92660A] mb-2">Skal opfyldes</div>
              {mustCriteria.length === 0 ? (
                <p className="text-xs text-[#9B9590]">Ingen krav endnu — klik på et kriterium herunder for at gøre det til et krav.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {mustCriteria.map(c => (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => togglePriority(c.key)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-[#C8993A] text-white border border-[#C8993A] transition-colors"
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-widest text-[#9B9590] mb-2">Ønskeligt</div>
              {niceCriteria.length === 0 ? (
                <p className="text-xs text-[#9B9590]">Alle kriterier er markeret som krav.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {niceCriteria.map(c => (
                    <button
                      key={c.key}
                      type="button"
                      onClick={() => togglePriority(c.key)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white text-[#1A1F1C] border border-[#C8C0B0] hover:border-[#C8993A] transition-colors"
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

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

function PillRadio({ options, value, onChange }: {
  options: readonly { value: string; label: string }[]
  value: string
  onChange: (v: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button
          key={opt.value || '__none'}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
            value === opt.value
              ? 'bg-[#2D6A4F] text-white border-[#2D6A4F]'
              : 'bg-white text-[#1A1F1C] border-[#E0DAD0] hover:border-[#2D6A4F]'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function PillCheckGroup({ options, selected, toggle }: {
  options: readonly string[]
  selected: string[]
  toggle: (v: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map(opt => (
        <button
          key={opt}
          type="button"
          onClick={() => toggle(opt)}
          className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
            selected.includes(opt)
              ? 'bg-[#2D6A4F] text-white border-[#2D6A4F]'
              : 'bg-white text-[#1A1F1C] border-[#E0DAD0] hover:border-[#2D6A4F]'
          }`}
        >
          {opt}
        </button>
      ))}
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
