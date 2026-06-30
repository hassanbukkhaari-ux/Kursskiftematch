import { NextResponse } from 'next/server'

export function ok<T>(data: T, status = 200) {
  return NextResponse.json(data, { status })
}

export function created<T>(data: T) {
  return NextResponse.json(data, { status: 201 })
}

export function noContent() {
  return new NextResponse(null, { status: 204 })
}

export function badRequest(message: string) {
  return NextResponse.json({ error: message }, { status: 400 })
}

export function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

export function forbidden() {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

export function notFound(resource = 'Resource') {
  return NextResponse.json({ error: `${resource} not found` }, { status: 404 })
}

export function conflict(message: string) {
  return NextResponse.json({ error: message }, { status: 409 })
}

export function unprocessable(message: string) {
  return NextResponse.json({ error: message }, { status: 422 })
}

export function serverError(message = 'Internal server error') {
  return NextResponse.json({ error: message }, { status: 500 })
}

export async function withAuth(
  request: Request,
  handler: (userId: string, role: string) => Promise<NextResponse>
): Promise<NextResponse> {
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()

  if (error || !user) return unauthorized()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile) return unauthorized()

  return handler(user.id, profile.role)
}

export async function withAdminAuth(
  request: Request,
  handler: (userId: string) => Promise<NextResponse>
): Promise<NextResponse> {
  return withAuth(request, async (userId, role) => {
    if (role !== 'admin') return forbidden()
    return handler(userId)
  })
}
