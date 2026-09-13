import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

// Replaces a case's linked codes for one of the three intake tag junction
// tables entirely — used both at case creation (where there's nothing to
// remove yet) and at edit time (where stale links must be cleared first,
// since the case's tags at intake are otherwise a one-shot, never-editable
// snapshot). `codes` undefined means "leave as-is" (field not sent);
// an empty array means "clear all".

export async function syncProblemAreas(db: SupabaseClient<Database>, caseId: string, codes?: string[]) {
  if (codes === undefined) return
  await db.from('case_problem_areas').delete().eq('case_id', caseId)
  if (codes.length === 0) return
  const { data: lookups } = await db.from('problem_areas').select('id, code').in('code', codes)
  if (!lookups || lookups.length === 0) return
  await db.from('case_problem_areas').insert(lookups.map(l => ({ case_id: caseId, problem_area_id: l.id })))
}

export async function syncGoals(db: SupabaseClient<Database>, caseId: string, codes?: string[]) {
  if (codes === undefined) return
  await db.from('case_goals').delete().eq('case_id', caseId)
  if (codes.length === 0) return
  const { data: lookups } = await db.from('goals_lookup').select('id, code').in('code', codes)
  if (!lookups || lookups.length === 0) return
  await db.from('case_goals').insert(lookups.map(l => ({ case_id: caseId, goal_id: l.id })))
}

export async function syncSpecialWishes(db: SupabaseClient<Database>, caseId: string, codes?: string[]) {
  if (codes === undefined) return
  await db.from('case_special_wishes').delete().eq('case_id', caseId)
  if (codes.length === 0) return
  const { data: lookups } = await db.from('special_wishes_lookup').select('id, code').in('code', codes)
  if (!lookups || lookups.length === 0) return
  await db.from('case_special_wishes').insert(lookups.map(l => ({ case_id: caseId, special_wish_id: l.id })))
}
