-- Round 7 security cleanup

-- 1) Drop the bad function if it somehow survived
DROP FUNCTION IF EXISTS public.ingest_off_product(jsonb);
DROP FUNCTION IF EXISTS public.ingest_off_product(text);

-- 2) Drop any leftover broad offers SELECT policy
DROP POLICY IF EXISTS "read active offers" ON public.offers;

-- 3) Corrected offers column lockdown
REVOKE SELECT ON public.offers FROM authenticated, anon, PUBLIC;
REVOKE INSERT ON public.offers FROM authenticated, anon, PUBLIC;
REVOKE UPDATE ON public.offers FROM authenticated, anon, PUBLIC;

GRANT SELECT (
  id, title, description, image_url,
  product_id, product_group_id, section_id,
  offer_type, discount_value, supermarket,
  target_plans, starts_at, ends_at,
  max_views, max_clicks, views_count, clicks_count,
  is_active, created_at
) ON public.offers TO authenticated;

-- "read active offers safe" policy removed; reads go through public.offers_public view

DROP POLICY IF EXISTS "admins read all offers" ON public.offers;
CREATE POLICY "admins read all offers" ON public.offers
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

-- 4) Reapply tightened analytics insert policies
DROP POLICY IF EXISTS "insert offer view" ON public.offer_views;
DROP POLICY IF EXISTS "insert own offer view" ON public.offer_views;
CREATE POLICY "insert own offer view" ON public.offer_views
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "insert offer click" ON public.offer_clicks;
DROP POLICY IF EXISTS "insert own offer click" ON public.offer_clicks;
CREATE POLICY "insert own offer click" ON public.offer_clicks
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "insert ad impression" ON public.ad_impressions;
DROP POLICY IF EXISTS "insert own ad impression" ON public.ad_impressions;
CREATE POLICY "insert own ad impression" ON public.ad_impressions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "insert ad click" ON public.ad_clicks;
DROP POLICY IF EXISTS "insert own ad click" ON public.ad_clicks;
CREATE POLICY "insert own ad click" ON public.ad_clicks
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 5) Column lockdown for subscriptions and scanner_orders
REVOKE SELECT ON public.subscriptions FROM authenticated, anon, PUBLIC;
GRANT SELECT (
  id, user_id, plan_id, status,
  current_period_start, current_period_end,
  cancel_at_period_end, billing_period, created_at
) ON public.subscriptions TO authenticated;

REVOKE SELECT ON public.scanner_orders FROM authenticated, anon, PUBLIC;
GRANT SELECT (
  id, user_id, household_id, quantity, unit_price, total,
  currency, scanner_color, status, full_name, address1, address2,
  city, postal_code, country, phone, tracking_number,
  created_at, updated_at
) ON public.scanner_orders TO authenticated;

-- 6) Remove public read on scanner-images storage
DROP POLICY IF EXISTS "public read scanner images" ON storage.objects;
