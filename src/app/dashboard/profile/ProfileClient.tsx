'use client'

import React, { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import type { DocumentRow, CertificateRow } from './page'

// ── Types ────────────────────────────────────────────────────────────────

type LT = { id: string; name: string }

type Pro = {
  job_title?: string | null; phone?: string | null
  address?: string | null; postal_code?: string | null; city?: string | null
  region?: string | null; profile_image_url?: string | null
  profession_type_id?: string | null; specialization?: string | null
  authorization_note?: string | null; experience_years?: number | null
  education?: string | null; bio?: string | null
  max_hours_per_week?: number | null
  available_now?: boolean; can_take_acute?: boolean
  can_work_evening?: boolean; can_work_weekend?: boolean; can_work_night?: boolean
  has_drivers_license?: boolean; has_own_car?: boolean; can_transport_citizen?: boolean
  max_driving_radius_km?: number | null; gender?: string | null
}

interface Props {
  profileName: string; profileEmail: string
  professional: Pro | null
  professionTypes: LT[]; competencyTypes: LT[]; methodTypes: LT[]
  targetGroupTypes: LT[]; workTaskTypes: LT[]; languageTypes: LT[]
  certificateTypes: LT[]; municipalities: LT[]
  selectedCompetencies: string[]; selectedMethods: string[]
  selectedTargetGroups: string[]; selectedWorkTasks: string[]
  selectedLanguages: string[]; selectedGeography: string[]
  documents: DocumentRow[]; certificates: CertificateRow[]
  consents: string[]
}

// ── Shared hook ──────────────────────────────────────────────────────────

function useSave() {
  const router = useRouter()
  const [pending, startT] = useTransition()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)

  async function save(url: string, body: object, method = 'PATCH') {
    setSaving(true); setError(null); setSaved(false)
    try {
      const res = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        setError((j as { error?: string }).error ?? 'Noget gik galt')
        return false
      }
      setSaved(true)
      startT(() => router.refresh())
      return true
    } catch {
      setError('Netværksfejl — prøv igen')
      return false
    } finally {
      setSaving(false)
    }
  }

  return { busy: saving || pending, error, saved, save }
}

// ── Shared components ────────────────────────────────────────────────────

function SectionCard({
  id, title, complete, open, onToggle, children,
}: {
  id: string; title: string; complete: boolean
  open: boolean; onToggle: () => void; children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-2xl border border-[#E0DAD0] overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-[#F6F3EE] transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <span className={[
            'w-2 h-2 rounded-full shrink-0',
            complete ? 'bg-[#1C3829]' : 'bg-[#E0DAD0]',
          ].join(' ')} />
          <span className="text-sm font-semibold text-[#1A1F1C]">{title}</span>
        </div>
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none"
          stroke="#C8C0B0" strokeWidth="1.75" strokeLinecap="round"
          className={`transition-transform duration-200 ${open ? 'rotate-90' : ''}`}
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>
      {open && (
        <div className="px-6 pb-6 pt-2 border-t border-[#F0EBE3]">
          {children}
        </div>
      )}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-1.5">
        {label}
      </label>
      {children}
    </div>
  )
}

function Input({ value, onChange, placeholder, type = 'text', disabled }: {
  value: string; onChange?: (v: string) => void; placeholder?: string
  type?: string; disabled?: boolean
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={e => onChange?.(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full h-10 px-3 bg-[#F6F3EE] rounded-xl text-sm text-[#1A1F1C] border-0 focus:outline-none focus:ring-2 focus:ring-[#1C3829] disabled:opacity-60"
    />
  )
}

function Textarea({ value, onChange, placeholder, rows = 4, maxLength }: {
  value: string; onChange: (v: string) => void; placeholder?: string
  rows?: number; maxLength?: number
}) {
  return (
    <textarea
      rows={rows}
      value={value}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      className="w-full px-3 py-2.5 bg-[#F6F3EE] rounded-xl text-sm text-[#1A1F1C] border-0 focus:outline-none focus:ring-2 focus:ring-[#1C3829] resize-none"
    />
  )
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="flex items-center justify-between w-full py-2"
    >
      <span className="text-sm text-[#1A1F1C]">{label}</span>
      <div className={[
        'w-10 h-6 rounded-full transition-colors relative shrink-0',
        value ? 'bg-[#1C3829]' : 'bg-[#E0DAD0]',
      ].join(' ')}>
        <div className={[
          'absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform',
          value ? 'translate-x-5' : 'translate-x-1',
        ].join(' ')} />
      </div>
    </button>
  )
}

function SaveBar({ busy, error, saved, onSave }: {
  busy: boolean; error: string | null; saved: boolean; onSave: () => void
}) {
  return (
    <div className="mt-5 pt-4 border-t border-[#F0EBE3] flex items-center justify-between gap-4">
      <div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        {saved && !error && <p className="text-sm text-[#1C3829]">Gemt ✓</p>}
      </div>
      <button
        onClick={onSave}
        disabled={busy}
        className="h-9 px-5 bg-[#1C3829] text-white text-sm font-semibold rounded-xl hover:bg-[#2D5840] transition-colors disabled:opacity-50 shrink-0"
      >
        {busy ? 'Gemmer…' : 'Gem'}
      </button>
    </div>
  )
}

function ChipGrid({
  items, selected, onToggle, max,
}: {
  items: LT[]; selected: string[]; onToggle: (id: string) => void; max?: number
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map(item => {
        const checked = selected.includes(item.id)
        const disabled = !checked && max !== undefined && selected.length >= max
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onToggle(item.id)}
            disabled={disabled}
            className={[
              'px-3 py-1.5 rounded-xl text-xs font-medium border transition-all',
              checked
                ? 'bg-[#1C3829] text-white border-[#1C3829]'
                : disabled
                ? 'text-[#C8C0B0] border-[#E0DAD0] bg-white cursor-not-allowed'
                : 'text-[#1A1F1C] border-[#E0DAD0] bg-white hover:border-[#1C3829] hover:text-[#1C3829]',
            ].join(' ')}
          >
            {item.name}
          </button>
        )
      })}
    </div>
  )
}

// ── Section: Personlig information ───────────────────────────────────────

function ProfilePhotoUpload({ currentUrl }: { currentUrl?: string | null }) {
  const router = useRouter()
  const [, startT] = useTransition()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [localUrl, setLocalUrl] = useState(currentUrl ?? null)
  const inputRef = React.useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true); setError(null)
    try {
      const urlRes = await fetch('/api/profile/upload-url', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_type: 'PROFILE_IMAGE', file_name: file.name }),
      })
      if (!urlRes.ok) { setError('Upload fejlede'); return }
      const { signed_url, public_url } = await urlRes.json()

      const up = await fetch(signed_url, {
        method: 'PUT', body: file,
        headers: { 'Content-Type': file.type || 'image/jpeg' },
      })
      if (!up.ok) { setError('Upload fejlede — prøv igen'); return }

      await fetch('/api/profile', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profile_image_url: public_url }),
      })
      setLocalUrl(public_url)
      startT(() => router.refresh())
    } catch { setError('Netværksfejl') }
    finally { setUploading(false); if (inputRef.current) inputRef.current.value = '' }
  }

  return (
    <div className="flex flex-col items-center gap-2 py-2">
      <div className="relative">
        <div className="w-20 h-20 rounded-full overflow-hidden bg-[#2D5840] flex items-center justify-center">
          {localUrl
            ? <img src={localUrl} alt="Profilbillede" className="w-full h-full object-cover" />
            : <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
          }
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#1C3829] border-2 border-white flex items-center justify-center hover:bg-[#2D5840] transition-colors disabled:opacity-50"
          title={uploading ? 'Uploader…' : 'Skift foto'}
        >
          {uploading
            ? <svg width="12" height="12" viewBox="0 0 16 16" fill="none" className="animate-spin"><circle cx="8" cy="8" r="6" stroke="white" strokeWidth="2" strokeOpacity="0.3" /><path d="M14 8a6 6 0 0 0-6-6" stroke="white" strokeWidth="2" strokeLinecap="round" /></svg>
            : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
          }
        </button>
      </div>
      <input ref={inputRef} type="file" className="hidden" accept="image/jpeg,image/png,image/webp" onChange={handleFile} />
      <p className="text-[10px] text-[#6B7569]">{uploading ? 'Uploader…' : 'Profilbillede'}</p>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  )
}

function S1Personal({ pro, profileName, profileEmail }: { pro: Pro | null; profileName: string; profileEmail: string }) {
  const { busy, error, saved, save } = useSave()
  const [f, setF] = useState({
    job_title: pro?.job_title ?? '',
    phone: pro?.phone ?? '',
    address: pro?.address ?? '',
    postal_code: pro?.postal_code ?? '',
    city: pro?.city ?? '',
    region: pro?.region ?? '',
  })
  const set = (k: keyof typeof f) => (v: string) => setF(p => ({ ...p, [k]: v }))

  const REGIONS = ['Hovedstaden', 'Sjælland', 'Syddanmark', 'Midtjylland', 'Nordjylland']

  return (
    <div className="space-y-4 mt-4">
      <ProfilePhotoUpload currentUrl={pro?.profile_image_url} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Fulde navn"><Input value={profileName} disabled /></Field>
        <Field label="E-mail"><Input value={profileEmail} disabled /></Field>
        <Field label="Jobtitel"><Input value={f.job_title} onChange={set('job_title')} placeholder="F.eks. Kontaktperson" /></Field>
        <Field label="Telefon"><Input value={f.phone} onChange={set('phone')} placeholder="+45 12 34 56 78" type="tel" /></Field>
      </div>
      <Field label="Adresse"><Input value={f.address} onChange={set('address')} placeholder="Gadenavn og nummer" /></Field>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <Field label="Postnummer"><Input value={f.postal_code} onChange={set('postal_code')} placeholder="8000" /></Field>
        <Field label="By"><Input value={f.city} onChange={set('city')} placeholder="Aarhus" /></Field>
        <Field label="Region">
          <select
            value={f.region}
            onChange={e => setF(p => ({ ...p, region: e.target.value }))}
            className="w-full h-10 px-3 bg-[#F6F3EE] rounded-xl text-sm text-[#1A1F1C] border-0 focus:outline-none focus:ring-2 focus:ring-[#1C3829]"
          >
            <option value="">Vælg region…</option>
            {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
        </Field>
      </div>
      <SaveBar busy={busy} error={error} saved={saved} onSave={() => save('/api/profile', f)} />
    </div>
  )
}

// ── Section: Profession ──────────────────────────────────────────────────

function parseEducations(raw: string | null | undefined): string[] {
  if (!raw) return ['']
  try {
    const parsed = JSON.parse(raw)
    if (Array.isArray(parsed) && parsed.length > 0) return parsed
  } catch { /* fall through */ }
  return [raw]
}

function serializeEducations(entries: string[]): string | null {
  const filtered = entries.map(e => e.trim()).filter(Boolean)
  if (filtered.length === 0) return null
  if (filtered.length === 1) return filtered[0]
  return JSON.stringify(filtered)
}

function S2Profession({ pro, professionTypes }: { pro: Pro | null; professionTypes: LT[] }) {
  const { busy, error, saved, save } = useSave()
  const [f, setF] = useState({
    profession_type_id: pro?.profession_type_id ?? '',
    specialization: pro?.specialization ?? '',
    authorization_note: pro?.authorization_note ?? '',
    experience_years: pro?.experience_years?.toString() ?? '',
  })
  const [educations, setEducations] = useState<string[]>(() => parseEducations(pro?.education))
  const [otherLabel, setOtherLabel] = useState(pro?.specialization ?? '')
  const set = (k: keyof typeof f) => (v: string) => setF(p => ({ ...p, [k]: v }))

  const selectedType = professionTypes.find(t => t.id === f.profession_type_id)
  const isOther = selectedType?.name?.toLowerCase().includes('andet') || selectedType?.name?.toLowerCase().includes('other')

  function setEdu(i: number, v: string) {
    setEducations(prev => prev.map((e, idx) => idx === i ? v : e))
  }
  function addEdu() { setEducations(prev => [...prev, '']) }
  function removeEdu(i: number) {
    setEducations(prev => prev.length > 1 ? prev.filter((_, idx) => idx !== i) : [''])
  }

  return (
    <div className="space-y-4 mt-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Field label="Profession">
          <select
            value={f.profession_type_id}
            onChange={e => setF(p => ({ ...p, profession_type_id: e.target.value }))}
            className="w-full h-10 px-3 bg-[#F6F3EE] rounded-xl text-sm text-[#1A1F1C] border-0 focus:outline-none focus:ring-2 focus:ring-[#1C3829]"
          >
            <option value="">Vælg profession…</option>
            {professionTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </Field>
        <Field label="Antal års erfaring">
          <Input value={f.experience_years} onChange={set('experience_years')} type="number" placeholder="5" />
        </Field>
        {isOther && (
          <Field label="Titel (specificér)">
            <input
              type="text"
              value={otherLabel}
              onChange={e => setOtherLabel(e.target.value)}
              autoFocus
              placeholder="Skriv din titel her, f.eks. Familieterapeut"
              className="w-full h-10 px-3 bg-[#F6F3EE] rounded-xl text-sm text-[#1A1F1C] border-0 focus:outline-none focus:ring-2 focus:ring-[#1C3829]"
            />
          </Field>
        )}
        {!isOther && (
          <Field label="Specialisering"><Input value={f.specialization} onChange={set('specialization')} placeholder="F.eks. ABA, autisme" /></Field>
        )}
      </div>

      <div>
        <label className="block text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] mb-2">
          Uddannelse
        </label>
        <div className="space-y-2">
          {educations.map((edu, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="text"
                value={edu}
                onChange={e => setEdu(i, e.target.value)}
                placeholder={isOther ? 'Skriv din faktiske profession' : 'F.eks. Pædagoguddannelsen'}
                className="flex-1 h-10 px-3 bg-[#F6F3EE] rounded-xl text-sm text-[#1A1F1C] border-0 focus:outline-none focus:ring-2 focus:ring-[#1C3829]"
              />
              {educations.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeEdu(i)}
                  className="w-7 h-7 rounded-full bg-[#F6F3EE] flex items-center justify-center text-[#6B7569] hover:bg-[#FEE2E2] hover:text-[#B91C1C] transition-colors shrink-0"
                  title="Fjern"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            onClick={addEdu}
            className="flex items-center gap-1.5 text-xs text-[#1C3829] font-medium hover:text-[#2D5840] transition-colors mt-1"
          >
            <span className="w-5 h-5 rounded-full bg-[#F0F7F2] border border-[#A3C4AE] flex items-center justify-center text-[#1C3829] font-bold text-sm leading-none">+</span>
            Tilføj uddannelse
          </button>
        </div>
      </div>

      <Field label="Autorisation (hvis relevant)"><Input value={f.authorization_note} onChange={set('authorization_note')} placeholder="F.eks. Autoriseret psykolog" /></Field>
      <SaveBar busy={busy} error={error} saved={saved} onSave={() => save('/api/profile', {
        ...f,
        education: serializeEducations(educations),
        profession_type_id: f.profession_type_id || null,
        specialization: isOther ? otherLabel : f.specialization,
        experience_years: f.experience_years ? parseInt(f.experience_years) : null,
      })} />
    </div>
  )
}

// ── Section: Om mig som fagperson ────────────────────────────────────────

function S3Bio({ pro }: { pro: Pro | null }) {
  const { busy, error, saved, save } = useSave()
  const [bio, setBio] = useState(pro?.bio ?? '')

  return (
    <div className="space-y-3 mt-4">
      <p className="text-xs text-[#6B7569]">Beskriv din arbejdsstil, værdier og faglige tilgang. Vises for administrator. Maks. 1000 tegn.</p>
      <Textarea
        value={bio}
        onChange={setBio}
        rows={6}
        maxLength={1000}
        placeholder="Jeg arbejder relationsorienteret og tror på, at tillid er fundamentet for udvikling…"
      />
      <div className="text-xs text-[#C8C0B0] text-right">{bio.length}/1000</div>
      <SaveBar busy={busy} error={error} saved={saved} onSave={() => save('/api/profile', { bio })} />
    </div>
  )
}

// ── Section: Kernekompetencer ────────────────────────────────────────────

function S4Competencies({ initial, types }: { initial: string[]; types: LT[] }) {
  const { busy, error, saved, save } = useSave()
  const [selected, setSelected] = useState<string[]>(initial)

  function toggle(id: string) {
    if (selected.includes(id)) {
      setSelected(s => s.filter(x => x !== id))
    } else if (selected.length < 5) {
      setSelected(s => [...s, id])
    }
  }

  return (
    <div className="space-y-3 mt-4">
      <p className="text-xs text-[#6B7569]">Vælg de 1–5 kernekompetencer der vægtes ekstra i matching.</p>
      <ChipGrid items={types} selected={selected} onToggle={toggle} max={5} />
      <p className="text-xs text-[#6B7569]">{selected.length}/5 valgt</p>
      <SaveBar busy={busy} error={error} saved={saved}
        onSave={() => save('/api/profile/selections/competencies', { ids: selected }, 'PUT')} />
    </div>
  )
}

// ── Generic selection section ────────────────────────────────────────────

function SelectionSection({
  initial, types, endpoint, description,
}: {
  initial: string[]; types: LT[]; endpoint: string; description?: string
}) {
  const { busy, error, saved, save } = useSave()
  const [selected, setSelected] = useState<string[]>(initial)

  function toggle(id: string) {
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])
  }

  return (
    <div className="space-y-3 mt-4">
      {description && <p className="text-xs text-[#6B7569]">{description}</p>}
      <ChipGrid items={types} selected={selected} onToggle={toggle} />
      <SaveBar busy={busy} error={error} saved={saved}
        onSave={() => save(`/api/profile/selections/${endpoint}`, { ids: selected }, 'PUT')} />
    </div>
  )
}

// ── Section: Certifikater ────────────────────────────────────────────────

function S8Certificates({ certs, certTypes }: { certs: CertificateRow[]; certTypes: LT[] }) {
  const router = useRouter()
  const [pending, startT] = useTransition()
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({ certificate_type_id: '', custom_name: '', issued_at: '', expires_at: '' })

  async function handleAdd() {
    setSaving(true); setError(null)
    try {
      const body: Record<string, unknown> = {
        issued_at: form.issued_at || null,
        expires_at: form.expires_at || null,
      }
      if (form.certificate_type_id) body.certificate_type_id = form.certificate_type_id
      else if (form.custom_name) body.custom_name = form.custom_name
      else { setError('Vælg certifikat eller angiv navn'); return }

      const res = await fetch('/api/profile/certificates', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) { const j = await res.json().catch(() => ({})); setError((j as { error?: string }).error ?? 'Fejl'); return }
      setAdding(false)
      setForm({ certificate_type_id: '', custom_name: '', issued_at: '', expires_at: '' })
      startT(() => router.refresh())
    } catch { setError('Netværksfejl — prøv igen') }
    finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    const res = await fetch(`/api/profile/certificates/${id}`, { method: 'DELETE' })
    if (res.ok) startT(() => router.refresh())
  }

  const certName = (c: CertificateRow) => c.certificate_types?.name ?? c.custom_name ?? '—'

  return (
    <div className="space-y-3 mt-4">
      {certs.length > 0 && (
        <div className="space-y-2">
          {certs.map(c => (
            <div key={c.id} className="flex items-center justify-between py-2 border-b border-[#F0EBE3]">
              <div>
                <div className="text-sm font-medium text-[#1A1F1C]">{certName(c)}</div>
                {(c.issued_at || c.expires_at) && (
                  <div className="text-xs text-[#6B7569]">
                    {c.issued_at ? `Udstedt ${c.issued_at}` : ''}
                    {c.issued_at && c.expires_at ? ' · ' : ''}
                    {c.expires_at ? `Udløber ${c.expires_at}` : ''}
                  </div>
                )}
              </div>
              <button onClick={() => handleDelete(c.id)} className="text-xs text-red-500 hover:underline">Slet</button>
            </div>
          ))}
        </div>
      )}

      {!adding ? (
        <button onClick={() => setAdding(true)} className="text-sm font-semibold text-[#1C3829] hover:underline">
          + Tilføj certifikat
        </button>
      ) : (
        <div className="bg-[#F6F3EE] rounded-xl p-4 space-y-3">
          <Field label="Type">
            <select
              value={form.certificate_type_id}
              onChange={e => setForm(f => ({ ...f, certificate_type_id: e.target.value, custom_name: '' }))}
              className="w-full h-10 px-3 bg-white rounded-xl text-sm text-[#1A1F1C] border-0 focus:outline-none focus:ring-2 focus:ring-[#1C3829]"
            >
              <option value="">Vælg type…</option>
              {certTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </Field>
          {!form.certificate_type_id && (
            <Field label="Andet navn">
              <Input value={form.custom_name} onChange={v => setForm(f => ({ ...f, custom_name: v }))} placeholder="Kursus eller certificering" />
            </Field>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Udstedelsesdato"><Input type="date" value={form.issued_at} onChange={v => setForm(f => ({ ...f, issued_at: v }))} /></Field>
            <Field label="Udløbsdato"><Input type="date" value={form.expires_at} onChange={v => setForm(f => ({ ...f, expires_at: v }))} /></Field>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2 pt-1">
            <button onClick={() => setAdding(false)} className="flex-1 h-9 rounded-xl border border-[#E0DAD0] text-sm font-semibold text-[#1A1F1C] hover:bg-white transition-colors">Annuller</button>
            <button onClick={handleAdd} disabled={saving || pending} className="flex-1 h-9 rounded-xl bg-[#1C3829] text-white text-sm font-semibold hover:bg-[#2D5840] transition-colors disabled:opacity-50">
              {saving ? 'Tilføjer…' : 'Tilføj'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Section: Dokumenter ──────────────────────────────────────────────────

const DOC_TYPES = [
  { type: 'CRIMINAL_RECORD',  label: 'Straffeattest',       required: true,  managed: true  },
  { type: 'CHILD_PROTECTION', label: 'Børneattest',          required: true,  managed: true  },
  { type: 'CV',               label: 'CV',                   required: true,  managed: false },
  { type: 'QUALIFICATION',    label: 'Uddannelsesbeviser',   required: false, managed: false },
  { type: 'DRIVING_LICENSE',  label: 'Kørekort',             required: false, managed: false },
  { type: 'OTHER',            label: 'Autorisation / andet', required: false, managed: false },
]

const DOC_STATUS_LABEL: Record<string, string> = {
  PENDING_UPLOAD: 'Mangler', MISSING: 'Mangler', UNVERIFIED: 'Uploadet',
  UPLOADED: 'Uploadet', VERIFIED: 'Godkendt', APPROVED: 'Godkendt',
  REJECTED: 'Afvist', EXPIRING_SOON: 'Udløber snart', ARCHIVED: 'Arkiveret',
}
const DOC_STATUS_BADGE: Record<string, 'default' | 'amber' | 'green' | 'red'> = {
  PENDING_UPLOAD: 'default', MISSING: 'default', UNVERIFIED: 'amber',
  UPLOADED: 'amber', VERIFIED: 'green', APPROVED: 'green',
  REJECTED: 'red', EXPIRING_SOON: 'amber', ARCHIVED: 'default',
}

function DocUploadRow({ dt, doc }: { dt: typeof DOC_TYPES[0]; doc: DocumentRow | undefined }) {
  const router = useRouter()
  const [, startT] = useTransition()
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inputRef = React.useRef<HTMLInputElement>(null)
  const status = doc?.status ?? 'MISSING'

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true); setError(null)
    try {
      // 1. Get signed upload URL
      const urlRes = await fetch('/api/profile/upload-url', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_type: dt.type, file_name: file.name }),
      })
      if (!urlRes.ok) { setError('Kunne ikke oprette upload-URL'); return }
      const { signed_url, path } = await urlRes.json()

      // 2. Upload file directly to Supabase Storage
      const uploadRes = await fetch(signed_url, {
        method: 'PUT', body: file,
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
      })
      if (!uploadRes.ok) { setError('Upload mislykkedes — prøv igen'); return }

      // 3. Record document in DB
      const docRes = await fetch('/api/profile/documents', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_type: dt.type, file_path: path, file_name: file.name }),
      })
      if (!docRes.ok) { setError('Dokumentet blev uploadet, men kunne ikke registreres'); return }

      startT(() => router.refresh())
    } catch { setError('Netværksfejl — prøv igen') }
    finally { setUploading(false); if (inputRef.current) inputRef.current.value = '' }
  }

  return (
    <div className="py-3 border-b border-[#F0EBE3] last:border-0">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm text-[#1A1F1C] truncate">{dt.label}</span>
          {dt.required && <span className="text-xs text-[#C8C0B0] shrink-0">krævet</span>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant={DOC_STATUS_BADGE[status] ?? 'default'}>
            {DOC_STATUS_LABEL[status] ?? status}
          </Badge>
          {!dt.managed && (
            <>
              <input ref={inputRef} type="file" className="hidden" onChange={handleFile}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />
              <button
                onClick={() => inputRef.current?.click()}
                disabled={uploading}
                className="text-xs font-semibold text-[#1C3829] hover:underline disabled:opacity-50"
              >
                {uploading ? 'Uploader…' : doc ? 'Opdater' : 'Upload'}
              </button>
            </>
          )}
        </div>
      </div>
      {doc?.file_name && (
        <p className="text-xs text-[#6B7569] mt-0.5 truncate">{doc.file_name}</p>
      )}
      {error && <p className="text-xs text-red-600 mt-0.5">{error}</p>}
    </div>
  )
}

function S9Documents({ docs }: { docs: DocumentRow[] }) {
  const docMap = Object.fromEntries(docs.map(d => [d.document_type, d]))

  return (
    <div className="space-y-1 mt-4">
      <div className="flex gap-3 p-3 rounded-xl bg-[#FBF3E1] border border-[#E8C97A] mb-3">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B45309" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        <div>
          <p className="text-xs font-semibold text-[#92400E] mb-0.5">Straffeattest og børneattest indhentes af Kursskifte</p>
          <p className="text-xs text-[#B45309] leading-relaxed">
            Kursskifte indhenter og verificerer disse attester for dig. Du uploader selv CV, uddannelsesbeviser, kørekort og eventuel autorisation.
          </p>
        </div>
      </div>
      {DOC_TYPES.map(dt => (
        <DocUploadRow key={dt.type} dt={dt} doc={docMap[dt.type]} />
      ))}
    </div>
  )
}

// ── Section: Tilgængelighed ──────────────────────────────────────────────

function S10Availability({ pro }: { pro: Pro | null }) {
  const { busy, error, saved, save } = useSave()
  const [f, setF] = useState({
    max_hours_per_week: pro?.max_hours_per_week?.toString() ?? '',
    available_now: pro?.available_now ?? false,
    can_take_acute: pro?.can_take_acute ?? false,
    can_work_evening: pro?.can_work_evening ?? false,
    can_work_weekend: pro?.can_work_weekend ?? false,
    can_work_night: pro?.can_work_night ?? false,
  })

  return (
    <div className="space-y-4 mt-4">
      <Field label="Maks. timer pr. uge">
        <Input
          type="number" value={f.max_hours_per_week} placeholder="37"
          onChange={v => setF(p => ({ ...p, max_hours_per_week: v }))}
        />
      </Field>
      <div className="space-y-1 divide-y divide-[#F0EBE3]">
        <Toggle label="Ledig nu" value={f.available_now} onChange={v => setF(p => ({ ...p, available_now: v }))} />
        <Toggle label="Kan tage akutte sager" value={f.can_take_acute} onChange={v => setF(p => ({ ...p, can_take_acute: v }))} />
        <Toggle label="Kan arbejde aften" value={f.can_work_evening} onChange={v => setF(p => ({ ...p, can_work_evening: v }))} />
        <Toggle label="Kan arbejde weekend" value={f.can_work_weekend} onChange={v => setF(p => ({ ...p, can_work_weekend: v }))} />
        <Toggle label="Kan arbejde nat" value={f.can_work_night} onChange={v => setF(p => ({ ...p, can_work_night: v }))} />
      </div>
      <SaveBar busy={busy} error={error} saved={saved} onSave={() => save('/api/profile', {
        ...f,
        max_hours_per_week: f.max_hours_per_week ? parseInt(f.max_hours_per_week) : null,
      })} />
    </div>
  )
}

// ── Section: Geografi ────────────────────────────────────────────────────

function S11Geography({
  initialMunis, municipalities, pro,
}: { initialMunis: string[]; municipalities: LT[]; pro: Pro | null }) {
  const router = useRouter()
  const [pending, startT] = useTransition()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [selected, setSelected] = useState<string[]>(initialMunis)
  const [radius, setRadius] = useState(pro?.max_driving_radius_km?.toString() ?? '')
  const [search, setSearch] = useState('')

  const filtered = municipalities.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase())
  )

  function toggle(id: string) {
    setSelected(s => s.includes(id) ? s.filter(x => x !== id) : [...s, id])
  }

  async function handleSave() {
    setSaving(true); setError(null); setSaved(false)
    try {
      const [r1, r2] = await Promise.all([
        fetch('/api/profile/selections/geography', {
          method: 'PUT', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: selected }),
        }),
        fetch('/api/profile', {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ max_driving_radius_km: radius ? parseInt(radius) : null }),
        }),
      ])
      if (!r1.ok || !r2.ok) { setError('Noget gik galt — prøv igen'); return }
      setSaved(true)
      startT(() => router.refresh())
    } catch { setError('Netværksfejl — prøv igen') }
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-4 mt-4">
      <Field label="Maks. kørselsradius (km)">
        <Input type="number" value={radius} onChange={setRadius} placeholder="50" />
      </Field>
      <Field label="Kommuner du dækker">
        <Input value={search} onChange={setSearch} placeholder="Søg kommune…" />
      </Field>
      <div className="max-h-56 overflow-y-auto border border-[#E0DAD0] rounded-xl p-3 space-y-1">
        {filtered.map(m => (
          <label key={m.id} className="flex items-center gap-2 cursor-pointer py-0.5">
            <input
              type="checkbox"
              checked={selected.includes(m.id)}
              onChange={() => toggle(m.id)}
              className="rounded accent-[#1C3829]"
            />
            <span className="text-sm text-[#1A1F1C]">{m.name}</span>
          </label>
        ))}
        {filtered.length === 0 && <p className="text-xs text-[#6B7569]">Ingen kommuner matcher søgningen</p>}
      </div>
      <p className="text-xs text-[#6B7569]">{selected.length} {selected.length === 1 ? 'kommune' : 'kommuner'} valgt</p>
      <div className="mt-5 pt-4 border-t border-[#F0EBE3] flex items-center justify-between gap-4">
        <div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {saved && !error && <p className="text-sm text-[#1C3829]">Gemt ✓</p>}
        </div>
        <button
          onClick={handleSave}
          disabled={saving || pending}
          className="h-9 px-5 bg-[#1C3829] text-white text-sm font-semibold rounded-xl hover:bg-[#2D5840] transition-colors disabled:opacity-50"
        >
          {saving ? 'Gemmer…' : 'Gem'}
        </button>
      </div>
    </div>
  )
}

// ── Section: Transport ───────────────────────────────────────────────────

function S12Transport({ pro }: { pro: Pro | null }) {
  const { busy, error, saved, save } = useSave()
  const [f, setF] = useState({
    has_drivers_license: pro?.has_drivers_license ?? false,
    has_own_car: pro?.has_own_car ?? false,
    can_transport_citizen: pro?.can_transport_citizen ?? false,
  })

  return (
    <div className="space-y-1 mt-4 divide-y divide-[#F0EBE3]">
      <Toggle label="Har kørekort" value={f.has_drivers_license} onChange={v => setF(p => ({ ...p, has_drivers_license: v }))} />
      <Toggle label="Har egen bil" value={f.has_own_car} onChange={v => setF(p => ({ ...p, has_own_car: v }))} />
      <Toggle label="Kan transportere borger" value={f.can_transport_citizen} onChange={v => setF(p => ({ ...p, can_transport_citizen: v }))} />
      <div className="pt-4">
        <SaveBar busy={busy} error={error} saved={saved} onSave={() => save('/api/profile', f)} />
      </div>
    </div>
  )
}

// ── Section: Samtykker ───────────────────────────────────────────────────

const CONSENT_ITEMS = [
  { type: 'GDPR', label: 'GDPR — behandling af personoplysninger', version: '1.0' },
  { type: 'PRIVACY', label: 'Privatlivspolitik', version: '1.0' },
  { type: 'CONFIDENTIALITY', label: 'Tavshedspligt', version: '1.0' },
  { type: 'ETHICS', label: 'Etiske retningslinjer', version: '1.0' },
  { type: 'TERMS', label: 'Vilkår og betingelser', version: '1.0' },
  { type: 'DOCUMENT_STORAGE', label: 'Samtykke til opbevaring af dokumenter', version: '1.0' },
]

function S14Consents({ initialConsents }: { initialConsents: string[] }) {
  const router = useRouter()
  const [pending, startT] = useTransition()
  const [accepted, setAccepted] = useState<Set<string>>(new Set(initialConsents))
  const [saving, setSaving] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function toggle(type: string, version: string) {
    if (accepted.has(type)) return // consents can't be unaccepted via UI
    setSaving(type); setError(null)
    try {
      const res = await fetch('/api/profile/consents', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consent_type: type, document_version: version }),
      })
      if (!res.ok) { const j = await res.json().catch(() => ({})); setError((j as { error?: string }).error ?? 'Fejl'); return }
      setAccepted(s => new Set([...s, type]))
      startT(() => router.refresh())
    } catch { setError('Netværksfejl — prøv igen') }
    finally { setSaving(null) }
  }

  const allAccepted = CONSENT_ITEMS.every(c => accepted.has(c.type))

  async function acceptAll() {
    const pending = CONSENT_ITEMS.filter(c => !accepted.has(c.type))
    for (const c of pending) {
      await toggle(c.type, c.version)
    }
  }

  return (
    <div className="space-y-3 mt-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-[#6B7569]">Alle samtykker skal accepteres aktivt. Dato og tidspunkt logges.</p>
        {!allAccepted && (
          <button
            onClick={acceptAll}
            disabled={!!saving}
            className="text-xs font-semibold text-[#1C3829] hover:underline disabled:opacity-50 shrink-0 ml-3"
          >
            Acceptér alle
          </button>
        )}
      </div>
      {CONSENT_ITEMS.map(c => (
        <label key={c.type} className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={accepted.has(c.type)}
            onChange={() => toggle(c.type, c.version)}
            disabled={accepted.has(c.type) || saving === c.type}
            className="mt-0.5 rounded accent-[#1C3829]"
          />
          <span className={`text-sm ${accepted.has(c.type) ? 'text-[#1A1F1C]' : 'text-[#6B7569]'}`}>
            {c.label}
            {accepted.has(c.type) && <span className="ml-2 text-xs text-[#1C3829]">✓ Accepteret</span>}
          </span>
        </label>
      ))}
      {error && <p className="text-sm text-red-600">{error}</p>}
      {allAccepted && (
        <div className="mt-3 px-4 py-3 bg-[#EEF4F0] rounded-xl text-sm text-[#1C3829] font-medium">
          Alle samtykker er accepteret ✓
        </div>
      )}
    </div>
  )
}

// ── Progress calculation ─────────────────────────────────────────────────

function calcProgress(props: Props): { pct: number; missing: string[] } {
  const p = props.professional
  const checks: [boolean, string][] = [
    [!!(p?.job_title || p?.phone || p?.city), 'Personlig information (job, telefon eller by)'],
    [!!p?.profession_type_id, 'Profession'],
    [!!(p?.bio && p.bio.length > 50), 'Om mig som fagperson'],
    [props.selectedCompetencies.length > 0, 'Kernekompetencer'],
    [props.selectedMethods.length > 0, 'Pædagogiske metoder'],
    [props.selectedTargetGroups.length > 0, 'Erfaring med målgrupper'],
    [props.selectedWorkTasks.length > 0, 'Arbejdsopgaver'],
    [props.selectedGeography.length > 0, 'Geografi (kommuner)'],
    [props.selectedLanguages.length > 0, 'Sprog'],
    [!!(p?.max_hours_per_week), 'Tilgængelighed (timer/uge)'],
    [props.documents.some(d => ['APPROVED', 'VERIFIED', 'UPLOADED', 'UNVERIFIED'].includes(d.status)), 'Dokumenter'],
    [props.consents.length >= 6, 'Samtykker'],
  ]

  const done = checks.filter(([ok]) => ok)
  const missing = checks.filter(([ok]) => !ok).map(([, label]) => label)
  return { pct: Math.round((done.length / checks.length) * 100), missing }
}

// ── Main component ───────────────────────────────────────────────────────

export function ProfileClient(props: Props) {
  const { professional: pro } = props
  const [open, setOpen] = useState<string>('personal')
  const toggle = (id: string) => setOpen(o => o === id ? '' : id)

  const { pct, missing } = calcProgress(props)

  const sections: { id: string; title: string; complete: boolean; content: React.ReactNode }[] = [
    {
      id: 'personal', title: 'Personlig information',
      complete: !!(pro?.job_title || pro?.phone || pro?.city),
      content: <S1Personal pro={pro} profileName={props.profileName} profileEmail={props.profileEmail} />,
    },
    {
      id: 'profession', title: 'Profession',
      complete: !!pro?.profession_type_id,
      content: <S2Profession pro={pro} professionTypes={props.professionTypes} />,
    },
    {
      id: 'bio', title: 'Om mig som fagperson',
      complete: !!(pro?.bio && pro.bio.length > 50),
      content: <S3Bio pro={pro} />,
    },
    {
      id: 'competencies', title: 'Kernekompetencer (maks. 5)',
      complete: props.selectedCompetencies.length > 0,
      content: <S4Competencies initial={props.selectedCompetencies} types={props.competencyTypes} />,
    },
    {
      id: 'methods', title: 'Pædagogiske metoder',
      complete: props.selectedMethods.length > 0,
      content: <SelectionSection initial={props.selectedMethods} types={props.methodTypes} endpoint="methods" />,
    },
    {
      id: 'target-groups', title: 'Erfaring med målgrupper',
      complete: props.selectedTargetGroups.length > 0,
      content: <SelectionSection initial={props.selectedTargetGroups} types={props.targetGroupTypes} endpoint="target-groups" />,
    },
    {
      id: 'work-tasks', title: 'Arbejdsopgaver',
      complete: props.selectedWorkTasks.length > 0,
      content: <SelectionSection initial={props.selectedWorkTasks} types={props.workTaskTypes} endpoint="work-tasks" />,
    },
    {
      id: 'certificates', title: 'Certifikater og kurser',
      complete: props.certificates.length > 0,
      content: <S8Certificates certs={props.certificates} certTypes={props.certificateTypes} />,
    },
    {
      id: 'documents', title: 'Dokumenter',
      complete: props.documents.some(d => ['APPROVED', 'VERIFIED', 'UPLOADED', 'UNVERIFIED'].includes(d.status)),
      content: <S9Documents docs={props.documents} />,
    },
    {
      id: 'availability', title: 'Tilgængelighed',
      complete: !!pro?.max_hours_per_week,
      content: <S10Availability pro={pro} />,
    },
    {
      id: 'geography', title: 'Geografi',
      complete: props.selectedGeography.length > 0,
      content: <S11Geography initialMunis={props.selectedGeography} municipalities={props.municipalities} pro={pro} />,
    },
    {
      id: 'transport', title: 'Transport',
      complete: !!(pro?.has_drivers_license || pro?.has_own_car),
      content: <S12Transport pro={pro} />,
    },
    {
      id: 'languages', title: 'Sprog',
      complete: props.selectedLanguages.length > 0,
      content: <SelectionSection initial={props.selectedLanguages} types={props.languageTypes} endpoint="languages" />,
    },
    {
      id: 'consents', title: 'Samtykker',
      complete: props.consents.length >= 6,
      content: <S14Consents initialConsents={props.consents} />,
    },
  ]

  return (
    <div className="space-y-4">
      {/* Progress card */}
      <Card className="!p-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-base font-semibold text-[#1A1F1C]">Profil {pct}% komplet</div>
            {missing.length > 0 && (
              <div className="text-xs text-[#6B7569] mt-0.5">
                Mangler: {missing.slice(0, 3).join(', ')}{missing.length > 3 ? ` +${missing.length - 3} mere` : ''}
              </div>
            )}
          </div>
          <div className="text-2xl font-serif font-semibold text-[#1C3829]">{pct}%</div>
        </div>
        <div className="h-2 bg-[#E0DAD0] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#1C3829] rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </Card>

      {/* Sections */}
      <div className="space-y-2">
        {sections.map(s => (
          <SectionCard
            key={s.id}
            id={s.id}
            title={s.title}
            complete={s.complete}
            open={open === s.id}
            onToggle={() => toggle(s.id)}
          >
            {s.content}
          </SectionCard>
        ))}
      </div>
    </div>
  )
}
