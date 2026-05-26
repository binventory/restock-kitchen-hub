
-- 1. Guard admin probe functions
CREATE OR REPLACE FUNCTION public.get_admin_role(_user_id uuid)
 RETURNS admin_role
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _caller uuid := auth.uid();
BEGIN
  IF _caller IS NULL THEN RETURN NULL; END IF;
  IF _user_id <> _caller AND NOT public.is_admin(_caller) THEN
    RETURN NULL;
  END IF;
  RETURN (SELECT role FROM public.admin_team WHERE user_id = _user_id LIMIT 1);
END; $function$;

CREATE OR REPLACE FUNCTION public.has_admin_permission(_user_id uuid, _permission text)
 RETURNS boolean
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE _caller uuid := auth.uid();
BEGIN
  IF _caller IS NULL THEN RETURN false; END IF;
  IF _user_id <> _caller AND NOT public.is_admin(_caller) THEN
    RETURN false;
  END IF;
  RETURN COALESCE(
    (SELECT (permissions->>_permission)::boolean FROM public.admin_team WHERE user_id = _user_id),
    false
  ) OR public.is_admin(_user_id);
END; $function$;

REVOKE EXECUTE ON FUNCTION public.get_admin_role(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_admin_permission(uuid, text) FROM anon;

-- 2. Revoke coupon_id column SELECT from popup_notifications for non-admins
REVOKE SELECT (coupon_id) ON public.popup_notifications FROM authenticated, anon;

-- 3. Allow anonymous ad impression inserts (analytics)
DROP POLICY IF EXISTS "anon insert ad impression" ON public.ad_impressions;
CREATE POLICY "anon insert ad impression"
ON public.ad_impressions
FOR INSERT
TO anon
WITH CHECK (user_id IS NULL);

-- 4. Scanner-images bucket write policies (owner-only by household)
DROP POLICY IF EXISTS "owners upload scanner image" ON storage.objects;
CREATE POLICY "owners upload scanner image"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'scanner-images'
  AND EXISTS (
    SELECT 1 FROM public.scanners s
    WHERE s.id::text = (storage.foldername(name))[1]
      AND public.is_household_owner(auth.uid(), s.household_id)
  )
);

DROP POLICY IF EXISTS "owners update scanner image" ON storage.objects;
CREATE POLICY "owners update scanner image"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'scanner-images'
  AND EXISTS (
    SELECT 1 FROM public.scanners s
    WHERE s.id::text = (storage.foldername(name))[1]
      AND public.is_household_owner(auth.uid(), s.household_id)
  )
);

DROP POLICY IF EXISTS "owners delete scanner image" ON storage.objects;
CREATE POLICY "owners delete scanner image"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'scanner-images'
  AND EXISTS (
    SELECT 1 FROM public.scanners s
    WHERE s.id::text = (storage.foldername(name))[1]
      AND public.is_household_owner(auth.uid(), s.household_id)
  )
);
