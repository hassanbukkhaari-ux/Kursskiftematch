import { NextRequest } from 'next/server'
import { z } from 'zod'
import { ok, badRequest, notFound, serverError, withAdminAuth } from '@/lib/api-response'

const UpdateArticleSchema = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/).optional(),
  title: z.string().min(1).optional(),
  excerpt: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  category: z.string().min(1).optional(),
  tags: z.array(z.string()).optional(),
  is_published: z.boolean().optional(),
  reading_time_minutes: z.number().int().min(1).optional(),
  meta_title: z.string().nullable().optional(),
  meta_description: z.string().nullable().optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return withAdminAuth(request, async () => {
    let body: unknown
    try { body = await request.json() } catch { return badRequest('Invalid JSON') }

    const parsed = UpdateArticleSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.issues.map(e => e.message).join(', '))

    const { createClient } = await import('@/lib/supabase/server')
    const db = await createClient()

    const updateData: Record<string, unknown> = {
      ...parsed.data,
      updated_at: new Date().toISOString(),
    }

    if (typeof parsed.data.is_published !== 'undefined') {
      updateData.published_at = parsed.data.is_published ? new Date().toISOString() : null
    }

    const { data, error } = await db
      .from('cms_articles' as never)
      .update(updateData as never)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      if ((error as { code?: string }).code === '23505') return badRequest('En artikel med dette slug eksisterer allerede')
      return serverError(error.message)
    }
    if (!data) return notFound()

    return ok(data)
  })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  return withAdminAuth(request, async () => {
    const { createClient } = await import('@/lib/supabase/server')
    const db = await createClient()

    const { error } = await db
      .from('cms_articles' as never)
      .delete()
      .eq('id', id)

    if (error) return serverError(error.message)
    return ok({ deleted: true })
  })
}
