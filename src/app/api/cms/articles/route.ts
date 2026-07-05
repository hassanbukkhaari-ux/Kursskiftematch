import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, created, badRequest, serverError, withAdminAuth } from '@/lib/api-response'

const ArticleSchema = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, 'Slug må kun indeholde små bogstaver, tal og bindestreger'),
  title: z.string().min(1),
  excerpt: z.string().min(1),
  content: z.string().min(1),
  category: z.string().min(1),
  tags: z.array(z.string()).default([]),
  is_published: z.boolean().default(false),
  reading_time_minutes: z.number().int().min(1).default(5),
  meta_title: z.string().optional().nullable(),
  meta_description: z.string().optional().nullable(),
})

export async function GET(request: NextRequest) {
  return withAdminAuth(request, async () => {
    const { createClient } = await import('@/lib/supabase/server')
    const db = await createClient()
    const { data, error } = await db
      .from('cms_articles' as never)
      .select('id, slug, title, excerpt, category, tags, is_published, published_at, reading_time_minutes, created_at, updated_at')
      .order('created_at', { ascending: false })
    if (error) return serverError(error.message)
    return ok({ data })
  })
}

export async function POST(request: NextRequest) {
  return withAdminAuth(request, async () => {
    let body: unknown
    try { body = await request.json() } catch { return badRequest('Invalid JSON') }

    const parsed = ArticleSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.issues.map(e => e.message).join(', '))

    const { createClient } = await import('@/lib/supabase/server')
    const db = await createClient()

    const insertData = {
      ...parsed.data,
      published_at: parsed.data.is_published ? new Date().toISOString() : null,
    }

    const { data, error } = await db
      .from('cms_articles' as never)
      .insert(insertData as never)
      .select()
      .single()

    if (error) {
      if ((error as { code?: string }).code === '23505') return badRequest('En artikel med dette slug eksisterer allerede')
      return serverError(error.message)
    }

    return created(data)
  })
}
