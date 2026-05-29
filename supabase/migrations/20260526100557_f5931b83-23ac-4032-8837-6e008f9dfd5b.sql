-- A1) offers_public view
DROP VIEW IF EXISTS public.offers_public CASCADE;
CREATE VIEW public.offers_public
WITH (security_invoker = true) AS
SELECT
  id, title, description, image_url, product_id, product_group_id,
  section_id, offer_type, discount_value, supermarket, target_plans,
  starts_at, ends_at, max_views, max_clicks, views_count, clicks_count
FROM public.offers
WHERE is_active = true
  AND (ends_at IS NULL OR ends_at > now())
  AND (starts_at IS NULL OR starts_at <= now());

GRANT SELECT ON public.offers_public TO authenticated, anon;

-- A2) Drop broad offers policies
DROP POLICY IF EXISTS "read active offers" ON public.offers;
DROP POLICY IF EXISTS "admins read all offers" ON public.offers;

CREATE POLICY "admins read all offers" ON public.offers
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- A3) popup_notifications_public view
DROP POLICY IF EXISTS "read active popups" ON public.popup_notifications;

DROP VIEW IF EXISTS public.popup_notifications_public CASCADE;
CREATE VIEW public.popup_notifications_public
WITH (security_invoker = true) AS
SELECT
  id, title, message, type, coupon_id, referral_link_enabled,
  target_plan, starts_at, ends_at, is_active
FROM public.popup_notifications
WHERE is_active = true
  AND (ends_at IS NULL OR ends_at > now())
  AND (starts_at IS NULL OR starts_at <= now());

GRANT SELECT ON public.popup_notifications_public TO authenticated;

CREATE POLICY "admins read all popups" ON public.popup_notifications
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- A4) SECURITY DEFINER ingest function, replaces OFF insert policy
DROP POLICY IF EXISTS "openfoodfacts insert" ON public.products;

-- ============================================================
-- ingest_off_product RPC was REMOVED.
-- OpenFoodFacts ingestion happens server-side only via the
-- TanStack server function ingestOpenFoodFactsProduct, which
-- uses the service role and validates input. Clients never
-- insert into the global products table directly.
-- ============================================================
