DROP FUNCTION IF EXISTS public.ingest_off_product(jsonb);
DROP POLICY IF EXISTS "openfoodfacts insert" ON public.products;

DROP POLICY IF EXISTS "owners upload scanner image" ON storage.objects;
DROP POLICY IF EXISTS "owners update scanner image" ON storage.objects;
DROP POLICY IF EXISTS "owners delete scanner image" ON storage.objects;
DROP POLICY IF EXISTS "owners read scanner image" ON storage.objects;

CREATE POLICY "owners upload scanner image" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'scanner-images'
    AND EXISTS (
      SELECT 1 FROM public.scanners s
      WHERE s.id::text = (storage.foldername(name))[1]
        AND public.is_household_owner(auth.uid(), s.household_id)
    )
  );

CREATE POLICY "owners update scanner image" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'scanner-images'
    AND EXISTS (
      SELECT 1 FROM public.scanners s
      WHERE s.id::text = (storage.foldername(name))[1]
        AND public.is_household_owner(auth.uid(), s.household_id)
    )
  );

CREATE POLICY "owners delete scanner image" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'scanner-images'
    AND EXISTS (
      SELECT 1 FROM public.scanners s
      WHERE s.id::text = (storage.foldername(name))[1]
        AND public.is_household_owner(auth.uid(), s.household_id)
    )
  );

CREATE POLICY "owners read scanner image" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'scanner-images'
    AND EXISTS (
      SELECT 1 FROM public.scanners s
      WHERE s.id::text = (storage.foldername(name))[1]
        AND public.is_household_owner(auth.uid(), s.household_id)
    )
  );

DROP POLICY IF EXISTS "insert own offer click" ON public.offer_clicks;
DROP POLICY IF EXISTS "insert offer click" ON public.offer_clicks;
CREATE POLICY "insert own offer click" ON public.offer_clicks
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "insert own ad click" ON public.ad_clicks;
DROP POLICY IF EXISTS "insert ad click" ON public.ad_clicks;
CREATE POLICY "insert own ad click" ON public.ad_clicks
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "insert own ad impression" ON public.ad_impressions;
CREATE POLICY "insert own ad impression" ON public.ad_impressions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.views
    WHERE table_schema='public' AND table_name='popup_notifications_public'
  ) THEN
    EXECUTE 'CREATE VIEW public.popup_notifications_public
      WITH (security_invoker = true) AS
      SELECT id, title, message, image_url, cta_text, cta_url,
             display_type, target_plans, starts_at, ends_at, is_active
      FROM public.popup_notifications
      WHERE is_active = true
        AND (ends_at IS NULL OR ends_at > now())
        AND (starts_at IS NULL OR starts_at <= now())';
    EXECUTE 'GRANT SELECT ON public.popup_notifications_public TO authenticated';
  END IF;
END $$;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS name_en text,
  ADD COLUMN IF NOT EXISTS name_fr text,
  ADD COLUMN IF NOT EXISTS name_ar text,
  ADD COLUMN IF NOT EXISTS name_de text,
  ADD COLUMN IF NOT EXISTS keywords text[],
  ADD COLUMN IF NOT EXISTS categories_tags text[],
  ADD COLUMN IF NOT EXISTS food_groups_tags text[];

ALTER TABLE public.user_products
  ADD COLUMN IF NOT EXISTS name_en text,
  ADD COLUMN IF NOT EXISTS name_fr text,
  ADD COLUMN IF NOT EXISTS name_ar text,
  ADD COLUMN IF NOT EXISTS name_de text,
  ADD COLUMN IF NOT EXISTS keywords text[];

CREATE INDEX IF NOT EXISTS idx_products_search
  ON public.products
  USING gin (
    to_tsvector('simple',
      coalesce(name,'')   || ' ' ||
      coalesce(name_en,'')|| ' ' ||
      coalesce(name_fr,'')|| ' ' ||
      coalesce(name_ar,'')|| ' ' ||
      coalesce(name_de,'')|| ' ' ||
      coalesce(brand,'')  || ' ' ||
      coalesce(generic_name,'')
    )
  );

ALTER TABLE public.ai_usage
  ADD COLUMN IF NOT EXISTS feature text,
  ADD COLUMN IF NOT EXISTS prompt_length integer,
  ADD COLUMN IF NOT EXISTS latency_ms integer;

CREATE INDEX IF NOT EXISTS idx_ai_usage_user_month
  ON public.ai_usage(user_id, feature, created_at DESC);
