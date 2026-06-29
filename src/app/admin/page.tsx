import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Profile } from '@/types/database'

export default async function AdminPage() {
  const db = await createClient()
  const { data: { user } } = await db.auth.getUser()

  if (!user) redirect('/login')

  const { data: profileData } = await db
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const profile = profileData as Profile | null
  if (profile?.role !== 'admin') redirect('/dashboard')

  const [casesRes, prosRes, inquiriesRes] = await Promise.all([
    db.from('cases').select('id', { count: 'exact', head: true }).neq('status', 'ARCHIVED'),
    db.from('professionals').select('id', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
    db.from('inbound_inquiries').select('id', { count: 'exact', head: true }).eq('status', 'PENDING'),
  ])

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Kursskiftematch — Administration</h1>
        <span className="text-sm text-gray-500">{profile?.full_name}</span>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Overblik</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm font-medium text-gray-500 mb-1">Aktive sager</p>
            <p className="text-3xl font-bold text-blue-600">{casesRes.count ?? 0}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm font-medium text-gray-500 mb-1">Aktive fagpersoner</p>
            <p className="text-3xl font-bold text-green-600">{prosRes.count ?? 0}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm font-medium text-gray-500 mb-1">Nye henvendelser</p>
            <p className="text-3xl font-bold text-amber-600">{inquiriesRes.count ?? 0}</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <p className="text-sm font-medium text-gray-500 mb-1">Match-kørsler</p>
            <p className="text-3xl font-bold text-purple-600">—</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <a href="/admin/cases" className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow group">
            <p className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">Sagsstyring</p>
            <p className="text-sm text-gray-500 mt-1">Opret og administrer sager</p>
          </a>
          <a href="/admin/professionals" className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow group">
            <p className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">Fagpersoner</p>
            <p className="text-sm text-gray-500 mt-1">Administrer profiler og dokumenter</p>
          </a>
          <a href="/admin/matching" className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow group">
            <p className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">Matching</p>
            <p className="text-sm text-gray-500 mt-1">Start match-kørsler og tildel</p>
          </a>
          <a href="/admin/inquiries" className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow group">
            <p className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">Henvendelser</p>
            <p className="text-sm text-gray-500 mt-1">Indkomne kommunehenvendelser</p>
          </a>
          <a href="/admin/municipalities" className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow group">
            <p className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">Kommuner</p>
            <p className="text-sm text-gray-500 mt-1">Kommuner og kontrakter</p>
          </a>
          <a href="/admin/notifications" className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-sm transition-shadow group">
            <p className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors">Notifikationer</p>
            <p className="text-sm text-gray-500 mt-1">Notifikationslog og genforsendelse</p>
          </a>
        </div>
      </main>
    </div>
  )
}
