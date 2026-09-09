import { createAnonClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const db = createAnonClient()

  const { data, error } = await db
    .from('cms_articles' as never)
    .select('slug, is_published')

  return NextResponse.json({
    supabase_url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    articles: data,
    error: error ? { message: error.message, code: (error as any).code } : null,
  })
}
