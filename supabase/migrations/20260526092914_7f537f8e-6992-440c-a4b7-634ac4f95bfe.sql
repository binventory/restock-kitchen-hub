-- ============================================================
-- Restock — Security hardening round 3
-- Fixes findings from the Lovable security scan:
--  1. offers.coupon_code exposed
--  2. offers.sponsor_paid_eur / sponsor_name exposed (re-apply)
--  3. offer_clicks allows user_id IS NULL (anti-fraud)
--  4. scanner-images bucket fully public
-- 
-- The OFF insert policy finding is accepted as INFO — the
-- policy's WITH CHECK clause already restricts inserts to
-- source='openfoodfacts', is_approved=true, submitted_by_user_id
-- IS NULL. Switching to a server-only path would break the
-- client fallback when SUPABASE_SERVICE_ROLE_KEY is missing.
-- The household_invites finding is a false positive — the
-- "owner manage invites" policy is the only SELECT path.
-- ============================================================
-- 1) offers: hide coupon_code AND sensitive sponsor fields
REVOKE SELECT (coupon_code, sponsor_paid_eur, sponsor_name)
  ON public.offers FROM authenticated, anon;

-- 2) offer_clicks: require user_id = auth.uid() for 
--    authenticated, drop the user_id IS NULL loophole.
--    Anonymous clicks no longer allowed (analytics still 
--    work via ad_impressions which has a proper anon policy).
DROP POLICY IF EXISTS "insert offer click" ON public.offer_clicks;

CREATE POLICY "insert own offer click" ON public.offer_clicks
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 3) scanner-images bucket: switch to private + scoped read
UPDATE storage.buckets
  SET public = false
  WHERE id = 'scanner-images';

-- Drop the broad public read policy
DROP POLICY IF EXISTS "read scanner image file" ON storage.objects;

-- Only household OWNERS can read scanner images (matches the
-- write policies already in place from migration 001642).
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

-- 4) Verification: should return zero rows
DO $$
DECLARE
  found_issue text;
BEGIN
  -- coupon_code should NOT be readable by authenticated
  SELECT 'coupon_code still readable' INTO found_issue
  FROM information_schema.column_privileges
  WHERE table_name = 'offers'
    AND column_name = 'coupon_code'
    AND grantee = 'authenticated'
    AND privilege_type = 'SELECT';

  IF found_issue IS NOT NULL THEN
    RAISE WARNING '%', found_issue;
  END IF;
END $$;

-- End of migration.