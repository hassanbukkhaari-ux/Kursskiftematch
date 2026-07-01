'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'

interface Props {
  responseToken: string
}

export default function ProposalResponseClient({ responseToken }: Props) {
  const [pending, startTransition] = useTransition()
  const [note, setNote] = useState('')
  const [decision, setDecision] = useState<'ACCEPTED' | 'DECLINED' | null>(null)
  const [result, setResult] = useState<{ status: 'ACCEPTED' | 'DECLINED' } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showDeclineForm, setShowDeclineForm] = useState(false)

  function submitDecision(d: 'ACCEPTED' | 'DECLINED') {
    setError(null)
    setDecision(d)
    startTransition(async () => {
      try {
        const res = await fetch(`/api/proposal/${responseToken}/respond`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ decision: d, response_note: note.trim() || undefined }),
        })
        if (!res.ok) {
          const json = await res.json().catch(() => ({}))
          throw new Error(json.error ?? `Fejl ${res.status}`)
        }
        setResult({ status: d })
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Ukendt fejl')
        setDecision(null)
      }
    })
  }

  if (result) {
    return (
      <div className={`rounded-2xl border p-6 ${
        result.status === 'ACCEPTED'
          ? 'border-[#D1E7D8] bg-[#EEF4F0]'
          : 'border-[#E0DAD0] bg-white'
      }`}>
        <div className="text-sm font-semibold text-[#1A1F1C] mb-1">
          {result.status === 'ACCEPTED' ? 'Forslag accepteret' : 'Forslag afvist'}
        </div>
        <p className="text-sm text-[#6B7569]">
          {result.status === 'ACCEPTED'
            ? 'Tak for din bekræftelse. Sagen er nu aktiv og kontaktpersonen vil tage kontakt inden for kort tid.'
            : 'Vi har registreret dit svar og vil gennemgå sagen igen. Vi vender tilbage med et nyt forslag.'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      {!showDeclineForm ? (
        <div className="flex gap-3">
          <Button
            variant="primary"
            size="lg"
            className="flex-1 justify-center"
            loading={pending && decision === 'ACCEPTED'}
            onClick={() => submitDecision('ACCEPTED')}
          >
            Accepter forslag
          </Button>
          <Button
            variant="secondary"
            size="lg"
            className="flex-1 justify-center"
            onClick={() => setShowDeclineForm(true)}
          >
            Afvis forslag
          </Button>
        </div>
      ) : (
        <div className="rounded-2xl border border-[#E0DAD0] bg-white p-6 space-y-4">
          <div className="text-sm font-semibold text-[#1A1F1C]">Afvis forslag</div>
          <div>
            <label className="block text-xs font-semibold text-[#1A1F1C] mb-1">Bemærkning (valgfri)</label>
            <textarea
              className="w-full rounded-lg border border-[#E0DAD0] bg-white px-3 py-2 text-sm text-[#1A1F1C] placeholder:text-[#9A9E97] focus:outline-none focus:ring-2 focus:ring-[#2D6A4F] resize-none"
              rows={3}
              placeholder="Beskriv gerne årsagen til afvisningen…"
              value={note}
              onChange={e => setNote(e.target.value)}
            />
          </div>
          <div className="flex gap-3">
            <Button
              variant="danger"
              size="sm"
              className="flex-1 justify-center"
              loading={pending && decision === 'DECLINED'}
              onClick={() => submitDecision('DECLINED')}
            >
              Bekræft afvisning
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="flex-1 justify-center"
              onClick={() => setShowDeclineForm(false)}
            >
              Annuller
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
