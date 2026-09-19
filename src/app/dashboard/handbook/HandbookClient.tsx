'use client'

import { useMemo, useState } from 'react'
import { Card } from '@/components/ui/card'
import { SearchInput } from '@/components/ui/pagination'
import { MarkdownContent } from '@/components/public/MarkdownContent'
import type { HandbookSection } from '@/lib/handbook-content'

// Strip markdown syntax roughly enough for free-text search — good enough
// for matching whole words, not meant to be shown anywhere.
function toPlainText(markdown: string): string {
  return markdown.replace(/[#*_`|>-]/g, ' ').toLowerCase()
}

export function HandbookClient({ sections }: { sections: HandbookSection[] }) {
  const [query, setQuery] = useState('')

  const searchable = useMemo(
    () => sections.map(s => ({ ...s, plain: `${s.title} ${toPlainText(s.body)}`.toLowerCase() })),
    [sections]
  )

  const q = query.trim().toLowerCase()
  const visible = q ? searchable.filter(s => s.plain.includes(q)) : searchable

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6 items-start">
      {/* TOC — sticky on desktop, plain list on mobile */}
      <div className="lg:sticky lg:top-6 space-y-4">
        <SearchInput value={query} onChange={setQuery} placeholder="Søg i håndbogen..." />
        <Card className="p-3">
          <div className="text-[10px] font-semibold uppercase tracking-widest text-[#6B7569] px-2 mb-1.5">Indhold</div>
          <nav className="space-y-0.5" aria-label="Indholdsfortegnelse">
            {searchable.map(s => {
              const matches = !q || s.plain.includes(q)
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => scrollTo(s.id)}
                  className={[
                    'w-full text-left text-sm px-2 py-1.5 rounded-lg transition-colors',
                    matches
                      ? 'text-[#1A1F1C] hover:bg-[#EEF4F0] hover:text-[#1C3829]'
                      : 'text-[#C8C0B0]',
                  ].join(' ')}
                >
                  {s.title}
                </button>
              )
            })}
          </nav>
        </Card>
      </div>

      {/* Sections */}
      <div className="space-y-4 min-w-0">
        {visible.length === 0 && (
          <Card className="text-center py-10">
            <p className="text-sm text-[#6B7569]">Ingen afsnit matcher "{query}"</p>
          </Card>
        )}
        {visible.map(s => (
          <Card key={s.id} id={s.id} className="scroll-mt-20">
            <h2 className="font-serif text-lg font-semibold text-[#1A1F1C] mb-3">{s.title}</h2>
            <MarkdownContent content={s.body} />
          </Card>
        ))}
      </div>
    </div>
  )
}
