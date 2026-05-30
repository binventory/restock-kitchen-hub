CREATE OR REPLACE FUNCTION public.dev_grant_admin()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  _is_anon boolean;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  SELECT is_anonymous INTO _is_anon
  FROM auth.users WHERE id = auth.uid();
  IF _is_anon IS TRUE THEN
    UPDATE auth.users
    SET raw_app_meta_data =
      coalesce(raw_app_meta_data, '{}'::jsonb)
      || '{"is_admin": true}'::jsonb
    WHERE id = auth.uid();
  END IF;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.dev_grant_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.dev_grant_admin() TO authenticated;