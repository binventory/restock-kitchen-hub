
-- 1) Remove client-side OFF approved-insert bypass
DROP POLICY IF EXISTS "openfoodfacts insert" ON public.products;

-- 2) Restrict scanner token column reads to owners only.
-- Members can still read scanner rows (RLS), but cannot read the token column.
REVOKE SELECT (token) ON public.scanners FROM authenticated, anon;
-- Owners can read the token via the existing get_scanner_token() RPC.

-- 3) Guard is_admin so users can only check themselves (or admins can check anyone).
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE _caller uuid := auth.uid();
BEGIN
  IF _caller IS NULL THEN
    RETURN false;
  END IF;
  IF _user_id <> _caller THEN
    -- Only an admin can probe other users' admin status
    IF NOT COALESCE(
      (SELECT (raw_app_meta_data->>'is_admin')::boolean FROM auth.users WHERE id = _caller),
      false
    ) THEN
      RETURN false;
    END IF;
  END IF;
  RETURN COALESCE(
    (SELECT (raw_app_meta_data->>'is_admin')::boolean FROM auth.users WHERE id = _user_id),
    false
  );
END;
$function$;

-- 4) Fix mutable search_path on updated_at trigger
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$function$;

-- 5) Revoke EXECUTE from anon on SECURITY DEFINER functions that shouldn't be public.
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_admin_role(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.has_admin_permission(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_household_owner(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.is_household_member(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.create_household(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.accept_invite(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.cancel_own_order(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.request_data_export(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.delete_my_account() FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_scanner_token(uuid) FROM anon;
