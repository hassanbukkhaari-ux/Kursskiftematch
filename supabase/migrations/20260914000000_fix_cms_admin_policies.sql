-- =============================================================================
-- Fix: CMS admin write policies never evaluate to true
--
-- 20260705000000_cms_content.sql (added cms_categories, cms_municipalities,
-- cms_articles) reused auth.jwt()->>'role' = 'admin' for its admin write
-- policies. That exact pattern was already identified and fixed everywhere
-- else in 20260630000000_consolidated_init.sql ("the JWT role claim is
-- always 'authenticated'" — it never carries our app-level admin role), but
-- cms_content.sql was written after that fix and reintroduced the same bug,
-- so it was never caught. Effect: every INSERT/UPDATE/DELETE against these
-- three tables fails RLS for every admin, always — e.g. "new row violates
-- row-level security policy for table cms_articles" when creating an
-- article in Admin → Indsigt.
--
-- Fix: same as the rest of the codebase — use public.is_admin(), which
-- checks profiles.role = 'admin' for the current auth.uid().
--
-- Safe: replaces policy definitions only. No data or table structure changes.
-- =============================================================================

BEGIN;

DROP POLICY IF EXISTS "cms_categories_admin_write" ON public.cms_categories;
CREATE POLICY "cms_categories_admin_write" ON public.cms_categories
  FOR ALL USING (is_admin())
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "cms_municipalities_admin_write" ON public.cms_municipalities;
CREATE POLICY "cms_municipalities_admin_write" ON public.cms_municipalities
  FOR ALL USING (is_admin())
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "cms_articles_admin_all" ON public.cms_articles;
CREATE POLICY "cms_articles_admin_all" ON public.cms_articles
  FOR ALL USING (is_admin())
  WITH CHECK (is_admin());

COMMIT;
