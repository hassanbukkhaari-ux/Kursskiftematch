import { createServiceClient } from '@/lib/supabase/server'
import IntakeForm from './IntakeForm'

export const dynamic = 'force-dynamic'

export default async function IntakePage() {
  const db = createServiceClient()
  const dba = db as any // eslint-disable-line @typescript-eslint/no-explicit-any

  const [muniRes, problemAreasRes, goalsRes, specialWishesRes] = await Promise.all([
    db.from('municipalities').select('id, name').eq('status', 'ACTIVE').order('name'),
    db.from('problem_areas').select('id, code, label_da').eq('active', true).order('sort_order'),
    db.from('goals_lookup').select('id, code, label_da').eq('active', true).order('sort_order'),
    dba.from('special_wishes_lookup').select('id, code, label_da').eq('active', true).order('sort_order'),
  ])

  return (
    <div className="min-h-screen bg-[#F6F3EE]">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="mb-8">
          <div className="text-xs font-semibold uppercase tracking-widest text-[#6B7569] mb-2">Kursskiftematch</div>
          <h1 className="text-2xl font-bold text-[#1A1F1C] mb-2">Indsend en ny sag</h1>
          <p className="text-sm text-[#6B7569]">
            Udfyld formularen herunder for at indsende en sag. Vi vil matche borgeren med en egnet kontaktperson
            og vende tilbage med et forslag.
          </p>
        </div>

        <IntakeForm
          municipalities={muniRes.data ?? []}
          problemAreas={problemAreasRes.data ?? []}
          goals={goalsRes.data ?? []}
          specialWishes={specialWishesRes.data ?? []}
        />
      </div>
    </div>
  )
}
