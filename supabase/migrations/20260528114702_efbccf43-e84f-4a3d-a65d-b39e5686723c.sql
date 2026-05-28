CREATE OR REPLACE FUNCTION public.my_admin_status()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'is_admin', COALESCE(
      (SELECT (raw_app_meta_data->>'is_admin')::boolean
       FROM auth.users WHERE id = auth.uid()),
      false
    ),
    'role', (
      SELECT raw_app_meta_data->>'role'
      FROM auth.users WHERE id = auth.uid()
    )
  );
$$;

REVOKE EXECUTE ON FUNCTION public.my_admin_status() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_admin_status() TO authenticated;