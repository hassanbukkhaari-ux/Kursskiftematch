import { withAdminAuth, ok, badRequest, serverError } from '@/lib/api-response'
import { createServiceClient } from '@/lib/supabase/server'
import type { NextRequest } from 'next/server'
import { z } from 'zod'

const ALLOWED_MIME = new Set([
  'application/pdf',
  'image/jpeg', 'image/png', 'image/webp',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
])

const CreateDocSchema = z.object({
  file_name: z.string().min(1).max(255),
  mime_type: z.string().optional(),
  size_bytes: z.number().int().positive().optional(),
  description: z.string().max(500).optional(),
  storage_path: z.string().min(1),
})

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: caseId } = await params
  return withAdminAuth(request, async () => {
    const svc = createServiceClient()
    const { data, error } = await (svc as any)
      .from('case_documents')
      .select('id, file_name, mime_type, size_bytes, description, uploaded_at, uploaded_by, profiles!uploaded_by(full_name)')
      .eq('case_id', caseId)
      .order('uploaded_at', { ascending: false })
    if (error) return serverError(error.message)
    return ok({ data: data ?? [] })
  })
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: caseId } = await params
  return withAdminAuth(request, async (adminId) => {
    let body: unknown
    try { body = await request.json() } catch { return badRequest('Invalid JSON') }
    const parsed = CreateDocSchema.safeParse(body)
    if (!parsed.success) return badRequest(parsed.error.issues.map(e => e.message).join(', '))

    if (parsed.data.mime_type && !ALLOWED_MIME.has(parsed.data.mime_type)) {
      return badRequest('Filtypen er ikke tilladt. Brug PDF, billede eller Word-dokument.')
    }

    const svc = createServiceClient()
    const { data, error } = await (svc as any)
      .from('case_documents')
      .insert({
        case_id: caseId,
        file_name: parsed.data.file_name,
        storage_path: parsed.data.storage_path,
        mime_type: parsed.data.mime_type ?? null,
        size_bytes: parsed.data.size_bytes ?? null,
        description: parsed.data.description ?? null,
        uploaded_by: adminId,
      })
      .select()
      .single()

    if (error) return serverError(error.message)
    return ok({ data })
  })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: caseId } = await params
  return withAdminAuth(request, async () => {
    const { searchParams } = new URL(request.url)
    const docId = searchParams.get('docId')
    if (!docId) return badRequest('docId er påkrævet')

    const svc = createServiceClient()

    // Fetch storage_path first so we can delete from storage
    const { data: doc } = await (svc as any)
      .from('case_documents')
      .select('storage_path')
      .eq('id', docId)
      .eq('case_id', caseId)
      .single()

    if (!doc) return badRequest('Dokument ikke fundet')

    await svc.storage.from('case-documents').remove([doc.storage_path])

    const { error } = await (svc as any)
      .from('case_documents')
      .delete()
      .eq('id', docId)
      .eq('case_id', caseId)

    if (error) return serverError(error.message)
    return ok({ ok: true })
  })
}
