DROP FUNCTION IF EXISTS public.ingest_off_product(jsonb) CASCADE;
DROP FUNCTION IF EXISTS public.ingest_off_product(text) CASCADE;

DROP POLICY IF EXISTS "read active offers safe" ON public.offers;
DROP POLICY IF EXISTS "read active offers" ON public.offers;
DROP POLICY IF EXISTS "admins read all offers" ON public.offers;

CREATE POLICY "admins read all offers" ON public.offers
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

DROP VIEW IF EXISTS public.offers_public CASCADE;
CREATE VIEW public.offers_public
WITH (security_invoker = false) AS
SELECT
  id, title, description, image_url,
  product_id, product_group_id, section_id,
  offer_type, discount_value, supermarket, target_plans,
  starts_at, ends_at, max_views, max_clicks,
  views_count, clicks_count, is_active, created_at
FROM public.offers
WHERE is_active = true
  AND (ends_at IS NULL OR ends_at > now())
  AND (starts_at IS NULL OR starts_at <= now());

GRANT SELECT ON public.offers_public TO authenticated, anon;

DROP POLICY IF EXISTS "insert offer view" ON public.offer_views;
DROP POLICY IF EXISTS "insert own offer view" ON public.offer_views;
DROP POLICY IF EXISTS "av_insert_offer_view" ON public.offer_views;
CREATE POLICY "av_insert_offer_view" ON public.offer_views
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "insert offer click" ON public.offer_clicks;
DROP POLICY IF EXISTS "insert own offer click" ON public.offer_clicks;
DROP POLICY IF EXISTS "av_insert_offer_click" ON public.offer_clicks;
CREATE POLICY "av_insert_offer_click" ON public.offer_clicks
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "insert ad impression" ON public.ad_impressions;
DROP POLICY IF EXISTS "insert own ad impression" ON public.ad_impressions;
DROP POLICY IF EXISTS "av_insert_ad_impression" ON public.ad_impressions;
CREATE POLICY "av_insert_ad_impression" ON public.ad_impressions
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "insert ad click" ON public.ad_clicks;
DROP POLICY IF EXISTS "insert own ad click" ON public.ad_clicks;
DROP POLICY IF EXISTS "av_insert_ad_click" ON public.ad_clicks;
CREATE POLICY "av_insert_ad_click" ON public.ad_clicks
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());