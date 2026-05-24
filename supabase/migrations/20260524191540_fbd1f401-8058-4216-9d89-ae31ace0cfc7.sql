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
  _is_owner boolean;
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

  SELECT EXISTS(
    SELECT 1 FROM public.household_members
    WHERE household_id = _hid
      AND user_id = _uid
      AND role = 'owner'
  ) INTO _is_owner;

  IF NOT _is_owner THEN
    RAISE EXCEPTION 'Only household owners can view the scanner token';
  END IF;

  RETURN _token;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_scanner_token(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_scanner_token(uuid) TO authenticated;