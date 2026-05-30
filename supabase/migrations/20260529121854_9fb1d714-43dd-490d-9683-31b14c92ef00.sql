-- 1) Drop dead ingest RPC
DROP FUNCTION IF EXISTS public.ingest_off_product(jsonb);

-- 2) Re-confirm OpenFoodFacts insert policy removal
DROP POLICY IF EXISTS "openfoodfacts insert" ON public.products;

-- 3) Lock down offers financial columns
DROP POLICY IF EXISTS "read active offers" ON public.offers;
REVOKE SELECT (sponsor_paid_eur, sponsor_name, coupon_code)
  ON public.offers
  FROM authenticated, anon;

-- 4) Fix offer_views: scope inserts to auth.uid()
DROP POLICY IF EXISTS "insert offer view" ON public.offer_views;
CREATE POLICY "insert own offer view" ON public.offer_views
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 5a) shopping-photos
DROP POLICY IF EXISTS "auth own shopping photos" ON storage.objects;
CREATE POLICY "auth own shopping photos" ON storage.objects
  FOR ALL TO authenticated
  USING (
    bucket_id = 'shopping-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'shopping-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 5b) data-exports
DROP POLICY IF EXISTS "auth read own exports" ON storage.objects;
CREATE POLICY "auth read own exports" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'data-exports'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS "users delete own data exports" ON storage.objects;
CREATE POLICY "users delete own data exports" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'data-exports'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- 5c) scanner-images
DROP POLICY IF EXISTS "owners read scanner image" ON storage.objects;
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

DROP POLICY IF EXISTS "owners update scanner image" ON storage.objects;
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

DROP POLICY IF EXISTS "owners delete scanner image" ON storage.objects;
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

-- 5d) product-images: admin-only writes
DROP POLICY IF EXISTS "product-images owner update" ON storage.objects;
CREATE POLICY "product-images admin update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'product-images' AND public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "product-images owner delete" ON storage.objects;
CREATE POLICY "product-images admin delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'product-images' AND public.is_admin(auth.uid()));