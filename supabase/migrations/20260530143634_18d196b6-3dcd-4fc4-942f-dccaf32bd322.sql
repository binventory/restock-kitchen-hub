-- 1) Remove privilege-escalation function
DROP FUNCTION IF EXISTS public.dev_grant_admin() CASCADE;

-- 2) Drop ingest_off_product (all signatures)
DROP FUNCTION IF EXISTS public.ingest_off_product(jsonb) CASCADE;
DROP FUNCTION IF EXISTS public.ingest_off_product(text) CASCADE;
DROP FUNCTION IF EXISTS public.ingest_off_product() CASCADE;

-- 3) Move sensitive offer columns to admin-only table
CREATE TABLE IF NOT EXISTS public.offer_private (
  offer_id uuid PRIMARY KEY REFERENCES public.offers(id) ON DELETE CASCADE,
  sponsor_name text,
  sponsor_paid_eur numeric,
  coupon_code text
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.offer_private TO authenticated;
GRANT ALL ON public.offer_private TO service_role;

ALTER TABLE public.offer_private ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admins manage offer_private" ON public.offer_private;
CREATE POLICY "admins manage offer_private" ON public.offer_private
  FOR ALL TO authenticated
  USING (public.is_admin(auth.uid()))
  WITH CHECK (public.is_admin(auth.uid()));

INSERT INTO public.offer_private (offer_id, sponsor_name, sponsor_paid_eur, coupon_code)
SELECT id, sponsor_name, sponsor_paid_eur, coupon_code
FROM public.offers
ON CONFLICT (offer_id) DO NOTHING;

DROP VIEW IF EXISTS public.offers_public CASCADE;
ALTER TABLE public.offers DROP COLUMN IF EXISTS sponsor_name CASCADE;
ALTER TABLE public.offers DROP COLUMN IF EXISTS sponsor_paid_eur CASCADE;
ALTER TABLE public.offers DROP COLUMN IF EXISTS coupon_code CASCADE;

REVOKE ALL ON public.offers FROM anon;
GRANT SELECT ON public.offers TO authenticated;

DROP POLICY IF EXISTS "read active offers safe" ON public.offers;
CREATE POLICY "read active offers safe" ON public.offers
  FOR SELECT TO authenticated
  USING (is_active = true);

DROP POLICY IF EXISTS "admins read all offers" ON public.offers;
CREATE POLICY "admins read all offers" ON public.offers
  FOR SELECT TO authenticated
  USING (public.is_admin(auth.uid()));

CREATE VIEW public.offers_public
WITH (security_invoker = true) AS
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

-- 4) Remove anon analytics policy
DROP POLICY IF EXISTS "anon insert ad impression" ON public.ad_impressions;

-- 5) product-images: owner update/delete
DROP POLICY IF EXISTS "product-images own update" ON storage.objects;
CREATE POLICY "product-images own update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "product-images own delete" ON storage.objects;
CREATE POLICY "product-images own delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'product-images'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );