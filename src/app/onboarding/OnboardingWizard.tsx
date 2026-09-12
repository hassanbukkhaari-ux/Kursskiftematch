'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CompassMark } from '@/components/brand/compass'

type ProfType = { id: string; name: string }
type CompType = { id: string; name: string }
type Muni = { id: string; name: string }

type Props = {
  profileName: string
  professional: { phone: string | null; job_title: string | null; profession_type_id: string | null } | null
  professionTypes: ProfType[]
  competencyTypes: CompType[]
  municipalities: Muni[]
  existingConsents: string[]
  existingCompetencies: string[]
  existingGeography: string[]
}

const CONSENT_ITEMS = [
  {
    type: 'GDPR',
    label: 'Behandling af personoplysninger',
    description: 'Jeg accepterer, at Kursskifte behandler mine personoplysninger i overensstemmelse med GDPR.',
  },
  {
    type: 'PRIVACY',
    label: 'Privatlivspolitik',
    description: 'Jeg har læst og accepterer Kursskiftes privatlivspolitik.',
  },
  {
    type: 'CONFIDENTIALITY',
    label: 'Tavshedspligt',
    description: 'Jeg er bekendt med og accepterer min tavshedspligt vedrørende borgere og sager.',
  },
  {
    type: 'ETHICS',
    label: 'Etiske retningslinjer',
    description: 'Jeg accepterer Kursskiftes etiske retningslinjer for fagpersoner.',
  },
  {
    type: 'TERMS',
    label: 'Vilkår og betingelser',
    description: 'Jeg accepterer de generelle vilkår og betingelser for brug af Kursskifte-platformen.',
  },
  {
    type: 'DOCUMENT_STORAGE',
    label: 'Dokumentopbevaring',
    description: 'Jeg giver samtykke til, at Kursskifte opbevarer og verificerer de nødvendige dokumenter (straffeattest og børneattest).',
  },
]

const STEP_LABELS = ['Samtykker', 'Personlig info', 'Fagprofil', 'Kompetencer', 'Geografi']

export function OnboardingWizard({
  profileName,
  professional,
  professionTypes,
  competencyTypes,
  municipalities,
  existingConsents,
  existingCompetencies,
  existingGeography,
}: Props) {
  const router = useRouter()
  const firstName = profileName.split(' ')[0]

  const [step, setStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [consents, setConsents] = useState<Set<string>>(new Set(existingConsents))
  const [phone, setPhone] = useState(professional?.phone ?? '')
  const [jobTitle, setJobTitle] = useState(professional?.job_title ?? '')
  const [selectedProfessions, setSelectedProfessions] = useState<Set<string>>(
    professional?.profession_type_id ? new Set([professional.profession_type_id]) : new Set()
  )
  const [professionOtherLabel, setProfessionOtherLabel] = useState('')
  const [selectedCompetencies, setSelectedCompetencies] = useState<Set<string>>(new Set(existingCompetencies))
  const [selectedGeo, setSelectedGeo] = useState<Set<string>>(new Set(existingGeography))

  function toggleConsent(type: string) {
    setConsents(prev => {
      const next = new Set(prev)
      if (next.has(type)) next.delete(type); else next.add(type)
      return next
    })
  }

  function toggleCompetency(id: string) {
    setSelectedCompetencies(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else if (next.size < 5) next.add(id)
      return next
    })
  }

  function toggleGeo(id: string) {
    setSelectedGeo(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  function canAdvance(): boolean {
    if (step === 0) return CONSENT_ITEMS.every(c => consents.has(c.type))
    if (step === 1) return phone.trim().length >= 8 && jobTitle.trim().length >= 2
    if (step === 2) {
      if (selectedProfessions.size === 0) return false
      const primaryId = Array.from(selectedProfessions)[0]
      const primaryType = professionTypes.find(t => t.id === primaryId)
      const isPrimaryOther = primaryType?.name?.toLowerCase().includes('andet') || primaryType?.name?.toLowerCase().includes('other')
      if (isPrimaryOther) return professionOtherLabel.trim().length > 0
      return true
    }
    if (step === 3) return selectedCompetencies.size > 0
    if (step === 4) return selectedGeo.size > 0
    return false
  }

  async function handleNext() {
    if (!canAdvance() || saving) return
    setError(null)
    setSaving(true)

    try {
      if (step === 0) {
        const newConsents = CONSENT_ITEMS.map(c => c.type).filter(t => !existingConsents.includes(t))
        await Promise.all(
          newConsents.map(consent_type =>
            fetch('/api/profile/consents', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ consent_type, document_version: '1.0' }),
            }).then(r => { if (!r.ok) throw new Error('Kunne ikke gemme samtykke') })
          )
        )
      } else if (step === 1) {
        const r = await fetch('/api/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phone: phone.trim(), job_title: jobTitle.trim() }),
        })
        if (!r.ok) throw new Error('Kunne ikke gemme oplysninger')
      } else if (step === 2) {
        // Save primary profession (first selected) to profession_type_id
        const primaryId = Array.from(selectedProfessions)[0]
        const r = await fetch('/api/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            profession_type_id: primaryId,
            ...(professionOtherLabel.trim() ? { specialization: professionOtherLabel.trim() } : {}),
          }),
        })
        if (!r.ok) throw new Error('Kunne ikke gemme')
      } else if (step === 3) {
        const r = await fetch('/api/profile/selections/competencies', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: Array.from(selectedCompetencies) }),
        })
        if (!r.ok) throw new Error('Kunne ikke gemme kompetencer')
      } else if (step === 4) {
        const r = await fetch('/api/profile/selections/geography', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: Array.from(selectedGeo) }),
        })
        if (!r.ok) throw new Error('Kunne ikke gemme geografi')
        router.push('/dashboard/profile?welcome=1')
        return
      }

      setStep(prev => prev + 1)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Noget gik galt')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F6F3EE] flex flex-col items-center justify-start px-4 py-12">
      <div className="w-full max-w-[600px]">
        {/* Logo */}
        <div className="flex items-center gap-2.5 mb-8">
          <CompassMark size={28} />
          <span className="font-serif font-semibold text-[#1C3829] text-[15px] leading-none">Kursskifte</span>
        </div>

        {/* Headline */}
        <div className="mb-8">
          <h1 className="font-serif text-2xl font-semibold text-[#1A1F1C] mb-1">
            Hej {firstName} — opret din profil
          </h1>
          <p className="text-sm text-[#6B7569]">
            Gennemfør de {STEP_LABELS.length} trin nedenfor for at aktivere din konto.
          </p>
        </div>

        {/* Progress bar */}
        <div className="flex items-start gap-0 mb-8">
          {STEP_LABELS.map((label, i) => (
            <div key={i} className="flex items-start flex-1 last:flex-none">
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
                    i < step
                      ? 'bg-[#1C3829] text-white'
                      : i === step
                      ? 'bg-[#1C3829] text-white ring-4 ring-[#1C3829]/20'
                      : 'bg-white border-2 border-[#E0DAD0] text-[#6B7569]'
                  }`}
                >
                  {i < step ? (
                    <svg width="12" height="10" viewBox="0 0 12 10" fill="none">
                      <path d="M1 5L4 8L11 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : (
                    i + 1
                  )}
                </div>
                <span
                  className={`text-[10px] mt-1.5 text-center whitespace-nowrap ${
                    i === step ? 'text-[#1C3829] font-semibold' : 'text-[#6B7569]'
                  }`}
                >
                  {label}
                </span>
              </div>
              {i < STEP_LABELS.length - 1 && (
                <div
                  className={`flex-1 h-[2px] mt-4 mx-1 transition-colors ${
                    i < step ? 'bg-[#1C3829]' : 'bg-[#E0DAD0]'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-[#E0DAD0] shadow-[0_4px_24px_rgba(28,56,41,0.08)] px-6 py-8 sm:px-8 sm:py-10">
          {step === 0 && <StepConsents consents={consents} toggle={toggleConsent} />}
          {step === 1 && (
            <StepPersonal
              phone={phone}
              setPhone={setPhone}
              jobTitle={jobTitle}
              setJobTitle={setJobTitle}
            />
          )}
          {step === 2 && (
            <StepProfession
              professionTypes={professionTypes}
              selected={selectedProfessions}
              toggle={(id) => setSelectedProfessions(prev => {
                const next = new Set(prev)
                if (next.has(id)) next.delete(id); else next.add(id)
                return next
              })}
              otherLabel={professionOtherLabel}
              setOtherLabel={setProfessionOtherLabel}
            />
          )}
          {step === 3 && (
            <StepCompetencies
              competencyTypes={competencyTypes}
              selected={selectedCompetencies}
              toggle={toggleCompetency}
            />
          )}
          {step === 4 && (
            <StepGeography
              municipalities={municipalities}
              selected={selectedGeo}
              toggle={toggleGeo}
            />
          )}

          {error && (
            <div className="mt-5 flex items-center gap-2 p-3 bg-[#FEE2E2] border border-[#FECACA] rounded-xl text-sm text-[#B91C1C]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
            </div>
          )}

          <div className="mt-8 flex items-center justify-between">
            <button
              onClick={() => { setError(null); setStep(prev => Math.max(0, prev - 1)) }}
              disabled={step === 0 || saving}
              className="text-sm text-[#6B7569] hover:text-[#1A1F1C] transition-colors disabled:pointer-events-none disabled:opacity-0"
            >
              ← Tilbage
            </button>

            <button
              onClick={handleNext}
              disabled={!canAdvance() || saving}
              className="h-11 px-8 bg-[#1C3829] text-[#F6F3EE] rounded-xl text-sm font-semibold hover:bg-[#2D5840] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="animate-spin">
                    <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="2" strokeOpacity="0.25" />
                    <path d="M14 8a6 6 0 0 0-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                  Gemmer...
                </>
              ) : step === 4 ? (
                'Afslut og gå til profil →'
              ) : (
                'Næste →'
              )}
            </button>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-[#6B7569]">
          Kursskiftematch · kursskifte.dk
        </p>
      </div>
    </div>
  )
}

/* ── Step sub-components ─────────────────────────────────────────────── */

function StepConsents({ consents, toggle }: { consents: Set<string>; toggle: (t: string) => void }) {
  const allChecked = CONSENT_ITEMS.every(c => consents.has(c.type))
  return (
    <div>
      <h2 className="font-serif text-xl font-semibold text-[#1A1F1C] mb-1">Samtykker</h2>
      <p className="text-sm text-[#6B7569] mb-6">
        Alle seks samtykker er påkrævet, før du kan bruge platformen.
      </p>
      <div className="space-y-4">
        {CONSENT_ITEMS.map(item => (
          <label key={item.type} className="flex items-start gap-3 cursor-pointer group">
            <button
              type="button"
              onClick={() => toggle(item.type)}
              className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                consents.has(item.type)
                  ? 'bg-[#1C3829] border-[#1C3829]'
                  : 'border-[#C8C0B0] group-hover:border-[#1C3829] bg-white'
              }`}
            >
              {consents.has(item.type) && (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
            <div onClick={() => toggle(item.type)} className="flex-1">
              <p className="text-sm font-semibold text-[#1A1F1C] leading-snug">{item.label}</p>
              <p className="text-xs text-[#6B7569] mt-0.5 leading-relaxed">{item.description}</p>
            </div>
          </label>
        ))}
      </div>
      {allChecked && (
        <div className="mt-5 flex items-center gap-2 p-3 bg-[#F0F7F2] border border-[#A3C4AE] rounded-xl text-sm text-[#1C3829]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22,4 12,14.01 9,11.01" />
          </svg>
          Alle samtykker er accepteret — du kan fortsætte.
        </div>
      )}
    </div>
  )
}

function StepPersonal({
  phone, setPhone, jobTitle, setJobTitle,
}: {
  phone: string; setPhone: (v: string) => void
  jobTitle: string; setJobTitle: (v: string) => void
}) {
  return (
    <div>
      <h2 className="font-serif text-xl font-semibold text-[#1A1F1C] mb-1">Personlig information</h2>
      <p className="text-sm text-[#6B7569] mb-6">
        Disse oplysninger bruges internt — de vises ikke til borgere eller kommuner.
      </p>
      <div className="space-y-5">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest text-[#6B7569] mb-2">
            Mobilnummer <span className="text-[#C8993A]">*</span>
          </label>
          <input
            type="tel"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            placeholder="f.eks. 12 34 56 78"
            autoFocus
            autoComplete="tel"
            className="w-full border border-[#E0DAD0] rounded-xl px-4 py-2.5 text-sm text-[#1A1F1C] bg-[#F6F3EE] placeholder:text-[#C8C0B0] focus:outline-none focus:border-[#1C3829] focus:bg-white transition-colors"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest text-[#6B7569] mb-2">
            Titel / stilling <span className="text-[#C8993A]">*</span>
          </label>
          <input
            type="text"
            value={jobTitle}
            onChange={e => setJobTitle(e.target.value)}
            placeholder="f.eks. Socialrådgiver, Psykolog"
            autoComplete="organization-title"
            className="w-full border border-[#E0DAD0] rounded-xl px-4 py-2.5 text-sm text-[#1A1F1C] bg-[#F6F3EE] placeholder:text-[#C8C0B0] focus:outline-none focus:border-[#1C3829] focus:bg-white transition-colors"
          />
        </div>
      </div>
    </div>
  )
}

function StepProfession({
  professionTypes, selected, toggle, otherLabel, setOtherLabel,
}: {
  professionTypes: ProfType[]
  selected: Set<string>
  toggle: (id: string) => void
  otherLabel: string
  setOtherLabel: (v: string) => void
}) {
  const selectedArr = Array.from(selected)
  const primaryId = selectedArr[0]
  const primaryType = professionTypes.find(t => t.id === primaryId)
  const isPrimaryOther = primaryType?.name?.toLowerCase().includes('andet') || primaryType?.name?.toLowerCase().includes('other')

  return (
    <div>
      <h2 className="font-serif text-xl font-semibold text-[#1A1F1C] mb-1">Faglig baggrund</h2>
      <p className="text-sm text-[#6B7569] mb-1">
        Vælg alle de faglige baggrunde der passer på dig — du kan vælge flere.
      </p>
      <p className="text-xs text-[#C8993A] font-medium mb-6">
        Den første du vælger bruges som din primære profession i matching.
      </p>
      <div className="flex flex-wrap gap-2">
        {professionTypes.map((pt) => {
          const isSelected = selected.has(pt.id)
          const isPrimary = isSelected && selectedArr[0] === pt.id
          return (
            <button
              key={pt.id}
              type="button"
              onClick={() => toggle(pt.id)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-all flex items-center gap-1.5 ${
                isSelected
                  ? 'bg-[#1C3829] border-[#1C3829] text-white font-medium'
                  : 'bg-white border-[#E0DAD0] text-[#1A1F1C] hover:border-[#1C3829]'
              }`}
            >
              {pt.name}
              {isPrimary && (
                <span className="text-[10px] bg-[#A3C4AE] text-[#1C3829] px-1 py-0.5 rounded font-semibold leading-none">primær</span>
              )}
            </button>
          )
        })}
      </div>
      {isPrimaryOther && (
        <div className="mt-4">
          <label className="block text-xs font-semibold uppercase tracking-widest text-[#6B7569] mb-2">
            Titel (specificér) <span className="text-[#C8993A]">*</span>
          </label>
          <input
            type="text"
            value={otherLabel}
            onChange={e => setOtherLabel(e.target.value)}
            autoFocus
            placeholder="Skriv din titel, f.eks. Familieterapeut"
            className="w-full border border-[#E0DAD0] rounded-xl px-4 py-2.5 text-sm text-[#1A1F1C] bg-[#F6F3EE] placeholder:text-[#C8C0B0] focus:outline-none focus:border-[#1C3829] focus:bg-white transition-colors"
          />
        </div>
      )}
    </div>
  )
}

function StepCompetencies({
  competencyTypes, selected, toggle,
}: {
  competencyTypes: CompType[]; selected: Set<string>; toggle: (id: string) => void
}) {
  return (
    <div>
      <h2 className="font-serif text-xl font-semibold text-[#1A1F1C] mb-1">Kernekompetencer</h2>
      <p className="text-sm text-[#6B7569] mb-1">
        Vælg mindst 1 og op til 5 kernekompetencer.
      </p>
      <p className="text-xs text-[#C8993A] mb-6 font-medium">
        {selected.size}/5 valgt
      </p>
      <div className="flex flex-wrap gap-2">
        {competencyTypes.map(ct => {
          const isSelected = selected.has(ct.id)
          const isDisabled = !isSelected && selected.size >= 5
          return (
            <button
              key={ct.id}
              type="button"
              onClick={() => toggle(ct.id)}
              disabled={isDisabled}
              className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                isSelected
                  ? 'bg-[#1C3829] border-[#1C3829] text-white font-medium'
                  : isDisabled
                  ? 'bg-[#F6F3EE] border-[#E0DAD0] text-[#C8C0B0] cursor-not-allowed'
                  : 'bg-white border-[#E0DAD0] text-[#1A1F1C] hover:border-[#1C3829]'
              }`}
            >
              {ct.name}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function StepGeography({
  municipalities, selected, toggle,
}: {
  municipalities: Muni[]; selected: Set<string>; toggle: (id: string) => void
}) {
  const [search, setSearch] = useState('')
  const filtered = municipalities.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <h2 className="font-serif text-xl font-semibold text-[#1A1F1C] mb-1">Geografi</h2>
      <p className="text-sm text-[#6B7569] mb-6">
        Vælg hvilke kommuner du kan arbejde i. Du kan vælge flere.
      </p>
      <input
        type="search"
        placeholder="Søg efter kommune..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="w-full border border-[#E0DAD0] rounded-xl px-4 py-2.5 text-sm text-[#1A1F1C] bg-[#F6F3EE] placeholder:text-[#C8C0B0] focus:outline-none focus:border-[#1C3829] focus:bg-white transition-colors mb-3"
      />
      {selected.size > 0 && (
        <p className="text-xs text-[#1C3829] font-medium mb-3">{selected.size} kommune{selected.size !== 1 ? 'r' : ''} valgt</p>
      )}
      <div className="max-h-64 overflow-y-auto space-y-1 pr-1">
        {filtered.map(m => (
          <button
            key={m.id}
            type="button"
            onClick={() => toggle(m.id)}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center justify-between ${
              selected.has(m.id)
                ? 'bg-[#F0F7F2] text-[#1C3829] font-medium'
                : 'text-[#1A1F1C] hover:bg-[#F6F3EE]'
            }`}
          >
            {m.name}
            {selected.has(m.id) && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="20,6 9,17 4,12" />
              </svg>
            )}
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="text-sm text-[#6B7569] py-4 text-center">Ingen kommuner matcher søgningen</p>
        )}
      </div>
    </div>
  )
}
