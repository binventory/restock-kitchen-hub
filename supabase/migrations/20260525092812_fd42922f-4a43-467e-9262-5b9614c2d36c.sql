-- 0. Expand role check constraint to include 'owner'
ALTER TABLE public.household_members DROP CONSTRAINT IF EXISTS household_members_role_check;
ALTER TABLE public.household_members ADD CONSTRAINT household_members_role_check
  CHECK (role = ANY (ARRAY['owner'::text, 'admin'::text, 'member'::text]));

-- 1. Backfill
UPDATE public.household_members hm
SET role = 'owner'
FROM public.households h
WHERE h.id = hm.household_id
  AND h.created_by = hm.user_id
  AND hm.role <> 'owner';

-- 2. get_scanner_token uses is_household_owner
CREATE OR REPLACE FUNCTION public.get_scanner_token(_scanner_id uuid)
RETURNS text
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _hid uuid;
  _token text;
  _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  SELECT household_id, token INTO _hid, _token
  FROM public.scanners
  WHERE id = _scanner_id;
  IF _hid IS NULL THEN
    RAISE EXCEPTION 'Scanner not found';
  END IF;
  IF NOT public.is_household_owner(_uid, _hid) THEN
    RAISE EXCEPTION 'Only the household owner can view the scanner token';
  END IF;
  RETURN _token;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_scanner_token(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_scanner_token(uuid) TO authenticated;

-- 3. create_household upserts owner
CREATE OR REPLACE FUNCTION public.create_household(_name text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _hid uuid;
  _uid uuid := auth.uid();
  _has_default boolean;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  INSERT INTO public.households (name, created_by)
  VALUES (_name, _uid)
  RETURNING id INTO _hid;
  SELECT EXISTS(
    SELECT 1 FROM public.household_members
    WHERE user_id = _uid AND is_default
  ) INTO _has_default;
  INSERT INTO public.household_members (household_id, user_id, role, is_default)
  VALUES (_hid, _uid, 'owner', NOT _has_default)
  ON CONFLICT (household_id, user_id)
  DO UPDATE SET role = 'owner';
  RETURN _hid;
END;
$$;

-- 4. accept_invite explicit member role
CREATE OR REPLACE FUNCTION public.accept_invite(_token text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _hid uuid;
  _invited_email text;
  _uid uuid := auth.uid();
  _has_default boolean;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  SELECT household_id, invited_email INTO _hid, _invited_email
  FROM public.household_invites
  WHERE token = _token AND NOT accepted
  LIMIT 1;
  IF _hid IS NULL THEN
    RAISE EXCEPTION 'Invalid or used invite';
  END IF;
  IF _invited_email IS NOT NULL
     AND lower(trim(_invited_email)) <> lower(trim(auth.email()))
  THEN
    RAISE EXCEPTION 'This invite is for a different email address';
  END IF;
  SELECT EXISTS(
    SELECT 1 FROM public.household_members
    WHERE user_id = _uid AND is_default
  ) INTO _has_default;
  INSERT INTO public.household_members (household_id, user_id, role, is_default)
  VALUES (_hid, _uid, 'member', NOT _has_default)
  ON CONFLICT (household_id, user_id) DO NOTHING;
  UPDATE public.household_invites SET accepted = true WHERE token = _token;
  RETURN _hid;
END;
$$;

-- 5. Verification
DO $$
DECLARE bad_count int;
BEGIN
  SELECT COUNT(*) INTO bad_count
  FROM public.household_members hm
  JOIN public.households h ON h.id = hm.household_id
  WHERE h.created_by = hm.user_id AND hm.role <> 'owner';
  IF bad_count > 0 THEN
    RAISE WARNING 'Backfill incomplete: % rows still wrong', bad_count;
  END IF;
END $$;