'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface Props {
  caseId: string
  proposalId: string
}

// Lets admin pull back a proposal still awaiting the municipality's
// response, so a different candidate can be sent instead — whether
// because the professional said no outside the system, or admin simply
// wants to reconsider before the municipality answers.
export function WithdrawProposalClient({ caseId, proposalId }: Props) {
  const router = useRouter()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleWithdraw() {
    setError(null)
    setPending(true)
    try {
      const res = await fetch(`/api/cases/${caseId}/proposals/${proposalId}/withdraw`, { method: 'PATCH' })
      if (!res.ok) {
        const json = await res.json().catch(() => ({}))
        throw new Error(json.error ?? `Fejl ${res.status}`)
      }
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ukendt fejl')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="mt-3 pt-3 border-t border-[#E0DAD0]">
      {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
      <Button variant="secondary" size="sm" loading={pending} onClick={handleWithdraw}>
        Træk forslag tilbage
      </Button>
      <p className="text-[11px] text-[#9B9589] mt-1">Sagen går tilbage til Åben, så en anden kandidat kan foreslås.</p>
    </div>
  )
}
