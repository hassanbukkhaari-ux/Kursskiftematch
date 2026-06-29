import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/types/database'

export default async function DashboardPage() {
  const db = await createClient()
  const { data: { user } } = await db.auth.getUser()

  if (!user) redirect('/login')

  const { data: profileData } = await db
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const profile = profileData as Profile | null

  if (profile?.role === 'admin') {
    redirect('/admin')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Kursskiftematch</h1>
        <span className="text-sm text-gray-500">{profile?.full_name}</span>
      </header>
      <main className="max-w-4xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Mit dashboard</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <a href="/dashboard/cases" className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
            <p className="text-sm font-medium text-gray-500 mb-1">Mine sager</p>
            <p className="text-2xl font-bold text-gray-900">—</p>
          </a>
          <a href="/dashboard/session-logs" className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
            <p className="text-sm font-medium text-gray-500 mb-1">Sessionsdokumentation</p>
            <p className="text-2xl font-bold text-gray-900">—</p>
          </a>
          <a href="/dashboard/hours" className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow">
            <p className="text-sm font-medium text-gray-500 mb-1">Registrerede timer</p>
            <p className="text-2xl font-bold text-gray-900">—</p>
          </a>
        </div>
      </main>
    </div>
  )
}
