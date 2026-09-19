'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

const CONTACT_TYPE_LABEL: Record<string, string> = {
  PHONE_CALL: 'Telefon', EMAIL: 'E-mail', IN_PERSON: 'Møde', OTHER: 'Andet',
}

interface Props {
  caseId: string
  loggedContact: { contact_type: string; logged_at: string } | null
}

// Once a sag goes active, the natural next step is that the kontaktperson
// reaches out to kommunens sagsbehandler to arrange an opstartsmøde/brief
// on the borger before the forløb starts. That expectation previously lived
// nowhere in the system — this makes it visible and lets them log it once
// it's done, which also feeds the reminder cron (no log within a few days
// → nudge).
export function StartupContactCard({ caseId, loggedContact }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [contactType, setContactType] = useState('PHONE_CALL')
  const [note, setNote] = useState('')
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit() {
    setError(null)
    setPending(true)
    try {
      const res = await fetch(`/api/cases/${caseId}/contact-log`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact_type: contactType, note: note || null }),
      })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error ?? `Fejl ${res.status}`)
      }
      setOpen(false)
      setNote('')
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ukendt fejl')
    } finally {
      setPending(false)
    }
  }

  if (loggedContact) {
    return (
      <div className="rounded-2xl border border-[#D1E7D8] bg-[#EEF4F0] p-4">
        <div className="flex items-start gap-2.5">
          <svg className="shrink-0 mt-0.5" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1C3829" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <div>
            <div className="text-xs font-semibold text-[#1C3829]">Opstartskontakt logget</div>
            <p className="text-[11px] text-[#4A5A4F] mt-0.5">
              {CONTACT_TYPE_LABEL[loggedContact.contact_type] ?? loggedContact.contact_type} · {new Intl.DateTimeFormat('da-DK', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(loggedContact.logged_at))}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-[#F5DDB0] bg-[#FEF2E2] p-4">
      <div className="text-[10px] font-semibold uppercase tracking-widest text-[#92660A] mb-1.5">
        Opstartsmøde med sagsbehandler
      </div>
      <p className="text-xs text-[#6B5020] leading-relaxed mb-3">
        Tag kontakt til kommunens sagsbehandler for at aftale et opstartsmøde, hvor I gennemgår borgeren sammen, inden forløbet starter.
      </p>

      {!open ? (
        <Button variant="gold" size="sm" onClick={() => setOpen(true)}>
          Log at du har taget kontakt
        </Button>
      ) : (
        <div className="space-y-2">
          {error && <p className="text-xs text-red-600">{error}</p>}
          <select
            id="startup-contact-type"
            value={contactType}
            onChange={e => setContactType(e.target.value)}
            className="w-full h-9 px-2.5 text-xs bg-white border border-[#F5DDB0] rounded-lg text-[#1A1F1C]"
          >
            {Object.entries(CONTACT_TYPE_LABEL).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <textarea
            id="startup-contact-note"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Note (valgfri) — fx aftalt tidspunkt for opstartsmøde"
            rows={2}
            className="w-full px-2.5 py-2 text-xs bg-white border border-[#F5DDB0] rounded-lg text-[#1A1F1C] placeholder:text-[#C8B896] resize-none"
          />
          <div className="flex gap-2">
            <Button variant="gold" size="sm" loading={pending} onClick={handleSubmit}>
              Gem
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setOpen(false)} disabled={pending}>
              Annuller
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
