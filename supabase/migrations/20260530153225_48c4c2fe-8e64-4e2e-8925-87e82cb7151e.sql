
-- 1) Fix broken scanner-images storage policies (use storage.objects.name, not s.name)
DROP POLICY IF EXISTS "owners read scanner image"   ON storage.objects;
DROP POLICY IF EXISTS "owners update scanner image" ON storage.objects;
DROP POLICY IF EXISTS "owners delete scanner image" ON storage.objects;
DROP POLICY IF EXISTS "owners upload scanner image" ON storage.objects;

CREATE POLICY "owners read scanner image" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'scanner-images'
    AND EXISTS (
      SELECT 1 FROM public.scanners s
      WHERE s.id::text = (storage.foldername(storage.objects.name))[1]
        AND public.is_household_owner(auth.uid(), s.household_id)
    )
  );

CREATE POLICY "owners upload scanner image" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'scanner-images'
    AND EXISTS (
      SELECT 1 FROM public.scanners s
      WHERE s.id::text = (storage.foldername(storage.objects.name))[1]
        AND public.is_household_owner(auth.uid(), s.household_id)
    )
  );

CREATE POLICY "owners update scanner image" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'scanner-images'
    AND EXISTS (
      SELECT 1 FROM public.scanners s
      WHERE s.id::text = (storage.foldername(storage.objects.name))[1]
        AND public.is_household_owner(auth.uid(), s.household_id)
    )
  )
  WITH CHECK (
    bucket_id = 'scanner-images'
    AND EXISTS (
      SELECT 1 FROM public.scanners s
      WHERE s.id::text = (storage.foldername(storage.objects.name))[1]
        AND public.is_household_owner(auth.uid(), s.household_id)
    )
  );

CREATE POLICY "owners delete scanner image" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'scanner-images'
    AND EXISTS (
      SELECT 1 FROM public.scanners s
      WHERE s.id::text = (storage.foldername(storage.objects.name))[1]
        AND public.is_household_owner(auth.uid(), s.household_id)
    )
  );

-- 2) Revoke direct read of scanner.token; only get_scanner_token (SECURITY DEFINER) returns it
REVOKE SELECT (token) ON public.scanners FROM authenticated;
REVOKE SELECT (token) ON public.scanners FROM anon;
