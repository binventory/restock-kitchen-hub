
-- 1. Re-apply column-level REVOKE on offers sponsor data (idempotent)
REVOKE SELECT (sponsor_paid_eur, sponsor_name) ON public.offers FROM authenticated;
REVOKE SELECT (sponsor_paid_eur, sponsor_name) ON public.offers FROM anon;

-- 2. Hide coupon_id on popup_notifications from non-admins via column-level REVOKE
REVOKE SELECT (coupon_id) ON public.popup_notifications FROM authenticated;
REVOKE SELECT (coupon_id) ON public.popup_notifications FROM anon;
-- Grant admins back via a SECURITY DEFINER lookup: admins use is_admin() in app code with service role.
-- (Admins read via existing admin tooling/service-role; no extra policy needed.)

-- 3. Allow users to delete their own data export files (folder = auth.uid())
DROP POLICY IF EXISTS "users delete own data exports" ON storage.objects;
CREATE POLICY "users delete own data exports"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'data-exports'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
