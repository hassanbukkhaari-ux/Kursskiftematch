'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'

type Action = 'ACCEPT' | 'DECLINE' | 'REQUEST_CHANGES'

interface Props {
  token: string
}

export function ProposalResponseClient({ token }: Props) {
  const [pending, setPending] = useState<Action | null>(null)
  const [openNoteFor, setOpenNoteFor] = useState<Exclude<Action, 'ACCEPT'> | null>(null)
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState<Action | null>(null)

  async function submit(action: Action, noteValue?: string) {
    setError(null)
    setPending(action)
    try {
      const res = await fetch(`/api/municipality/proposals/${token}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, note: noteValue }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError((json as { error?: string }).error ?? 'Noget gik galt — prøv igen')
        return
      }
      setDone(action)
    } catch {
      setError('Netværksfejl — prøv igen')
    } finally {
      setPending(null)
    }
  }

  if (done) {
    const DONE_LABEL: Record<Action, string> = {
      ACCEPT: 'Tak — forslaget er accepteret, og sagen er nu aktiv.',
      DECLINE: 'Forslaget er afvist. Kursskifte følger op med et nyt forslag.',
      REQUEST_CHANGES: 'Din anmodning om ændringer er sendt til Kursskifte.',
    }
    return <p className="text-sm text-[#1C3829] font-medium">{DONE_LABEL[done]}</p>
  }

  if (openNoteFor) {
    const isDecline = openNoteFor === 'DECLINE'
    return (
      <div className="space-y-3">
        <label className="block text-[10px] font-semibold uppercase tracking-widest text-[#6B7569]">
          {isDecline ? 'Begrundelse for afvisning *' : 'Beskriv den ønskede ændring *'}
        </label>
        <textarea
          rows={3}
          value={note}
          onChange={e => setNote(e.target.value)}
          className="w-full px-3 py-2.5 bg-[#F6F3EE] rounded-xl text-sm text-[#1A1F1C] border-0 focus:outline-none focus:ring-2 focus:ring-[#1C3829] resize-none"
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => { setOpenNoteFor(null); setNote(''); setError(null) }}>
            Annuller
          </Button>
          <Button
            variant="primary"
            size="sm"
            loading={pending === openNoteFor}
            onClick={() => {
              if (!note.trim()) { setError('Skriv venligst en note'); return }
              submit(openNoteFor, note)
            }}
          >
            {isDecline ? 'Bekræft afvisning' : 'Send anmodning'}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {error && <p className="text-sm text-red-600 mb-1">{error}</p>}
      <Button variant="primary" loading={pending === 'ACCEPT'} onClick={() => submit('ACCEPT')} className="w-full">
        Accepter kandidaten
      </Button>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" onClick={() => setOpenNoteFor('REQUEST_CHANGES')} className="flex-1">
          Anmod om ændring
        </Button>
        <Button variant="secondary" size="sm" onClick={() => setOpenNoteFor('DECLINE')} className="flex-1">
          Afvis
        </Button>
      </div>
    </div>
  )
}
