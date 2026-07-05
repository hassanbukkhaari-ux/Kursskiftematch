'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

type ArticleData = {
  id: string
  slug: string
  title: string
  excerpt: string
  content: string
  category: string
  tags: string[]
  is_published: boolean
  reading_time_minutes: number
  meta_title: string | null
  meta_description: string | null
}

const CATEGORIES = [
  { slug: 'vejledning', name: 'Vejledning' },
  { slug: 'faglig-viden', name: 'Faglig viden' },
  { slug: 'matchning', name: 'Matchning' },
  { slug: 'dokumentation', name: 'Dokumentation' },
  { slug: 'lovgivning', name: 'Lovgivning' },
]

const inputClass =
  'w-full border border-[#E0DAD0] rounded-xl px-4 py-2.5 text-sm text-[#1A1F1C] bg-[#F6F3EE] placeholder:text-[#C8C0B0] focus:outline-none focus:border-[#1C3829] focus:bg-white transition-colors'

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/æ/g, 'ae').replace(/ø/g, 'oe').replace(/å/g, 'aa')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function ArticleEditorClient({
  article,
  isNew,
}: {
  article: ArticleData | null
  isNew: boolean
}) {
  const router = useRouter()
  const [saving, startSave] = useTransition()
  const [deleting, startDelete] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<Omit<ArticleData, 'id'>>({
    slug: article?.slug ?? '',
    title: article?.title ?? '',
    excerpt: article?.excerpt ?? '',
    content: article?.content ?? '',
    category: article?.category ?? 'vejledning',
    tags: article?.tags ?? [],
    is_published: article?.is_published ?? false,
    reading_time_minutes: article?.reading_time_minutes ?? 5,
    meta_title: article?.meta_title ?? null,
    meta_description: article?.meta_description ?? null,
  })
  const [tagsInput, setTagsInput] = useState((article?.tags ?? []).join(', '))
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(!isNew)

  function field<K extends keyof typeof form>(key: K) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const value = e.target.type === 'checkbox'
        ? (e.target as HTMLInputElement).checked
        : e.target.value
      setForm(f => ({ ...f, [key]: value }))
    }
  }

  function handleTitleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const title = e.target.value
    setForm(f => ({
      ...f,
      title,
      slug: slugManuallyEdited ? f.slug : slugify(title),
    }))
  }

  function handleSlugChange(e: React.ChangeEvent<HTMLInputElement>) {
    setSlugManuallyEdited(true)
    setForm(f => ({ ...f, slug: e.target.value }))
  }

  function handleTagsChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value
    setTagsInput(raw)
    const tags = raw.split(',').map(t => t.trim()).filter(Boolean)
    setForm(f => ({ ...f, tags }))
  }

  function handleSave(publish?: boolean) {
    startSave(async () => {
      setError(null)
      const payload = {
        ...form,
        ...(typeof publish !== 'undefined' ? { is_published: publish } : {}),
      }

      const url = isNew ? '/api/cms/articles' : `/api/cms/articles/${article!.id}`
      const method = isNew ? 'POST' : 'PATCH'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError((data as { error?: string }).error ?? 'Noget gik galt')
        return
      }

      router.push('/admin/indsigt')
      router.refresh()
    })
  }

  function handleDelete() {
    if (!article || !confirm('Er du sikker på, at du vil slette denne artikel? Dette kan ikke fortrydes.')) return
    startDelete(async () => {
      setError(null)
      const res = await fetch(`/api/cms/articles/${article.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError((data as { error?: string }).error ?? 'Kunne ikke slette')
        return
      }
      router.push('/admin/indsigt')
      router.refresh()
    })
  }

  const isValid = form.title.trim() && form.slug.trim() && form.content.trim() && form.excerpt.trim()

  return (
    <div className="space-y-6">
      {/* Core fields */}
      <div className="bg-white border border-[#E0DAD0] rounded-2xl p-6 space-y-5">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A]">Artikel</div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest text-[#6B7569] mb-2">Overskrift</label>
          <input
            type="text"
            value={form.title}
            onChange={handleTitleChange}
            placeholder="Hvad er artiklen om?"
            className={inputClass}
            autoFocus
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest text-[#6B7569] mb-2">Slug (URL)</label>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#6B7569] shrink-0">/indsigt/</span>
            <input
              type="text"
              value={form.slug}
              onChange={handleSlugChange}
              placeholder="artikel-slug"
              className={inputClass}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-[#6B7569] mb-2">Kategori</label>
            <select value={form.category} onChange={field('category')} className={inputClass}>
              {CATEGORIES.map(c => (
                <option key={c.slug} value={c.slug}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-widest text-[#6B7569] mb-2">Læsetid (minutter)</label>
            <input
              type="number"
              min="1"
              max="60"
              value={form.reading_time_minutes}
              onChange={(e) => setForm(f => ({ ...f, reading_time_minutes: parseInt(e.target.value) || 5 }))}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest text-[#6B7569] mb-2">Resumé (1-2 sætninger)</label>
          <textarea
            value={form.excerpt}
            onChange={field('excerpt')}
            placeholder="Kort beskrivelse af artiklen — vises på oversigten og i søgeresultater"
            rows={2}
            className={inputClass + ' resize-none'}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest text-[#6B7569] mb-2">Indhold (Markdown)</label>
          <textarea
            value={form.content}
            onChange={field('content')}
            placeholder="Skriv artiklens indhold her. Brug ## til overskrifter og **fed** til fremhævning."
            rows={20}
            className={inputClass + ' resize-y font-mono text-xs leading-relaxed'}
          />
          <p className="text-[10px] text-[#6B7569] mt-1">Understøtter Markdown: ## Overskrift, **fed**, *kursiv*, - liste, | tabel |</p>
        </div>
      </div>

      {/* Tags & SEO */}
      <div className="bg-white border border-[#E0DAD0] rounded-2xl p-6 space-y-5">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A]">Tags og SEO</div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest text-[#6B7569] mb-2">Tags (kommasepareret)</label>
          <input
            type="text"
            value={tagsInput}
            onChange={handleTagsChange}
            placeholder="kontaktperson, §52, vejledning"
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest text-[#6B7569] mb-2">Meta-titel (valgfri)</label>
          <input
            type="text"
            value={form.meta_title ?? ''}
            onChange={(e) => setForm(f => ({ ...f, meta_title: e.target.value || null }))}
            placeholder="Efterlad tom for at bruge artikelens overskrift"
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-xs font-semibold uppercase tracking-widest text-[#6B7569] mb-2">Meta-beskrivelse (valgfri)</label>
          <textarea
            value={form.meta_description ?? ''}
            onChange={(e) => setForm(f => ({ ...f, meta_description: e.target.value || null }))}
            placeholder="Efterlad tom for at bruge resuméet"
            rows={2}
            className={inputClass + ' resize-none'}
          />
        </div>
      </div>

      {/* Status */}
      <div className="bg-white border border-[#E0DAD0] rounded-2xl p-6">
        <div className="text-[10px] font-semibold uppercase tracking-widest text-[#C8993A] mb-4">Status</div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setForm(f => ({ ...f, is_published: false }))}
            className={[
              'flex-1 h-10 rounded-xl text-sm font-medium border transition-all',
              !form.is_published
                ? 'bg-[#6B7569] text-white border-[#6B7569]'
                : 'bg-white text-[#6B7569] border-[#E0DAD0] hover:border-[#6B7569]',
            ].join(' ')}
          >
            Kladde
          </button>
          <button
            type="button"
            onClick={() => setForm(f => ({ ...f, is_published: true }))}
            className={[
              'flex-1 h-10 rounded-xl text-sm font-medium border transition-all',
              form.is_published
                ? 'bg-[#1C3829] text-white border-[#1C3829]'
                : 'bg-white text-[#6B7569] border-[#E0DAD0] hover:border-[#1C3829]',
            ].join(' ')}
          >
            Udgivet
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 bg-[#FEE2E2] border border-[#FECACA] rounded-xl text-sm text-[#B91C1C]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="shrink-0">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center justify-between gap-3">
        <div>
          {!isNew && (
            <Button
              variant="secondary"
              onClick={handleDelete}
              loading={deleting}
              className="text-[#B91C1C] hover:bg-[#FEE2E2] border-[#FECACA]"
            >
              Slet artikel
            </Button>
          )}
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" onClick={() => router.push('/admin/indsigt')} disabled={saving}>
            Annuller
          </Button>
          <Button
            variant="primary"
            onClick={() => handleSave()}
            loading={saving}
            disabled={!isValid}
          >
            {isNew ? 'Opret artikel' : 'Gem ændringer'}
          </Button>
        </div>
      </div>
    </div>
  )
}
